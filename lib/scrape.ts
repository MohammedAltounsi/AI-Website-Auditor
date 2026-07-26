import * as cheerio from 'cheerio'
import * as net from 'node:net'
import { lookup as dnsLookup } from 'node:dns/promises'
import { Agent } from 'undici'
import type { ScrapeResult } from './types'

/** Thrown for policy rejections (bad input) — mapped to HTTP 400 by the API route. */
export class AuditRejectedError extends Error {}

const IPV4_BLOCKED_CIDRS: Array<[string, number]> = [
  ['0.0.0.0', 8], // "this network"
  ['10.0.0.0', 8], // RFC1918
  ['100.64.0.0', 10], // CGNAT — some cloud metadata proxies live here
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local — cloud metadata endpoints (169.254.169.254)
  ['172.16.0.0', 12], // RFC1918
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.168.0.0', 16], // RFC1918
  ['198.18.0.0', 15], // benchmarking
]

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0
}

function isBlockedIpv4(ip: string): boolean {
  const target = ipv4ToInt(ip)
  return IPV4_BLOCKED_CIDRS.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
    return (ipv4ToInt(base) & mask) === (target & mask)
  })
}

function isBlockedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase()
  if (normalized === '::1' || normalized === '::') return true
  // IPv4-mapped IPv6 (::ffff:169.254.169.254) — check the embedded IPv4 address.
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isBlockedIpv4(mapped[1])
  if (/^fe80:/.test(normalized)) return true // link-local
  if (/^f[cd][0-9a-f]{0,2}:/.test(normalized)) return true // fc00::/7 (ULA) — covers both fc and fd
  return false
}

export function isBlockedIp(ip: string): boolean {
  const family = net.isIP(ip)
  if (family === 4) return isBlockedIpv4(ip)
  if (family === 6) return isBlockedIpv6(ip)
  return true // not a parseable IP at all — refuse rather than guess
}

/**
 * Resolves a hostname and validates every address it points to, so a
 * literal private IP in the URL is rejected immediately and a hostname
 * that resolves to a private IP is rejected too (blocks the "public
 * domain that answers with 169.254.169.254" DNS-rebinding trick).
 */
async function resolveValidatedAddresses(hostname: string): Promise<string[]> {
  const literalFamily = net.isIP(hostname)
  if (literalFamily) {
    if (isBlockedIp(hostname)) {
      throw new AuditRejectedError('Auditing private/internal URLs is not allowed')
    }
    return [hostname]
  }

  if (hostname.toLowerCase() === 'localhost') {
    throw new AuditRejectedError('Auditing private/internal URLs is not allowed')
  }

  let records: Array<{ address: string; family: number }>
  try {
    records = await dnsLookup(hostname, { all: true })
  } catch {
    throw new Error(`Could not resolve ${hostname}`)
  }
  if (records.length === 0) {
    throw new Error(`Could not resolve ${hostname}`)
  }
  for (const { address } of records) {
    if (isBlockedIp(address)) {
      throw new AuditRejectedError('Auditing private/internal URLs is not allowed')
    }
  }
  return records.map((r) => r.address)
}

/**
 * Fetch pinned to pre-validated IPs: once we've resolved+checked a hostname,
 * the actual TCP connection is forced to use exactly those addresses,
 * regardless of what DNS answers at connect time. This closes the
 * resolve-then-reconnect (DNS-rebinding) gap a plain hostname check leaves open.
 */
function pinnedDispatcher(addresses: string[]): Agent {
  return new Agent({
    connect: {
      lookup: (_hostname, _options, callback) => {
        callback(
          null,
          addresses.map((address) => ({ address, family: net.isIP(address) === 6 ? 6 : 4 }))
        )
      },
    },
  })
}

const MAX_REDIRECTS = 5
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024 // 5MB — plenty for an HTML document, not for abuse

async function readBodyWithLimit(res: Response): Promise<string> {
  const reader = res.body?.getReader()
  if (!reader) return res.text()

  const decoder = new TextDecoder()
  let total = 0
  let result = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel()
      throw new AuditRejectedError('Response too large to audit')
    }
    result += decoder.decode(value, { stream: true })
  }
  result += decoder.decode()
  return result
}

async function fetchFollowingSafeRedirects(url: string): Promise<Response> {
  let currentUrl = url

  for (let hop = 0; ; hop++) {
    const parsed = new URL(currentUrl)
    const addresses = await resolveValidatedAddresses(parsed.hostname)

    const res = await fetch(currentUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuditorBot/1.0)' },
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
      dispatcher: pinnedDispatcher(addresses),
    } as RequestInit)

    const isRedirect = res.status >= 300 && res.status < 400
    if (!isRedirect) return res

    if (hop >= MAX_REDIRECTS) {
      throw new Error(`Too many redirects fetching ${url}`)
    }
    const location = res.headers.get('location')
    if (!location) {
      throw new Error(`Redirect from ${currentUrl} had no Location header`)
    }
    // Re-resolved and re-validated on the next loop iteration — this is what
    // stops a public URL from redirecting its way into an internal address.
    currentUrl = new URL(location, currentUrl).toString()
  }
}

export async function scrapePage(url: string): Promise<ScrapeResult> {
  const res = await fetchFollowingSafeRedirects(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }
  const html = await readBodyWithLimit(res)
  const $ = cheerio.load(html)

  const images = $('img')
  const imagesMissingAlt = images.filter((_, el) => !$(el).attr('alt')?.trim()).length
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()

  // ponytail: hard cap so a hostile <title>/<meta> can't bloat the Claude
  // prompt — these are display/analysis fields, not identifiers, so
  // truncation has no correctness cost.
  const truncate = (s: string) => s.slice(0, 300)

  return {
    title: truncate($('title').first().text().trim()) || null,
    metaDescription: truncate($('meta[name="description"]').attr('content')?.trim() ?? '') || null,
    h1Count: $('h1').length,
    imageCount: images.length,
    imagesMissingAlt,
    hasCanonical: $('link[rel="canonical"]').length > 0,
    hasViewportMeta: $('meta[name="viewport"]').length > 0,
    wordCount: bodyText ? bodyText.split(' ').length : 0,
  }
}
