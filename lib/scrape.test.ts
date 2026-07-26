import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('node:dns/promises', () => {
  const lookup = vi.fn(async () => [{ address: '93.184.216.34', family: 4 }])
  return { lookup, default: { lookup } }
})

import { lookup as dnsLookupImpl } from 'node:dns/promises'
import { scrapePage, isBlockedIp, AuditRejectedError } from './scrape'

// The real `lookup` overload set doesn't cleanly express the `{ all: true }`
// array-returning signature for a mock — cast once to the shape we actually use.
const dnsLookup = dnsLookupImpl as unknown as ReturnType<
  typeof vi.fn<(hostname: string, opts: { all: true }) => Promise<Array<{ address: string; family: number }>>>
>

const SAMPLE_HTML = `
<html>
  <head>
    <title>Test Page</title>
    <meta name="description" content="A test page" />
    <link rel="canonical" href="https://example.com" />
    <meta name="viewport" content="width=device-width" />
  </head>
  <body>
    <h1>Hello</h1>
    <img src="a.jpg" alt="cat" />
    <img src="b.jpg" />
    <p>Some words here for the body text count.</p>
  </body>
</html>
`

function htmlResponse(html: string) {
  return { ok: true, status: 200, body: null, text: async () => html } as unknown as Response
}

describe('scrapePage', () => {
  beforeEach(() => {
    dnsLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
    global.fetch = vi.fn(async () => htmlResponse(SAMPLE_HTML)) as unknown as typeof fetch
  })

  it('extracts SEO signals from HTML', async () => {
    const result = await scrapePage('https://example.com')
    expect(result.title).toBe('Test Page')
    expect(result.metaDescription).toBe('A test page')
    expect(result.h1Count).toBe(1)
    expect(result.imageCount).toBe(2)
    expect(result.imagesMissingAlt).toBe(1)
    expect(result.hasCanonical).toBe(true)
    expect(result.hasViewportMeta).toBe(true)
    expect(result.wordCount).toBeGreaterThan(0)
  })

  it('throws when the fetch fails', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 404, body: null, text: async () => '' })) as unknown as typeof fetch
    await expect(scrapePage('https://example.com/missing')).rejects.toThrow('Failed to fetch')
  })

  it('follows a same-site redirect and scrapes the final destination', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        status: 301,
        ok: false,
        body: null,
        headers: new Headers({ location: 'https://example.com/' }),
      })
      .mockResolvedValueOnce(htmlResponse(SAMPLE_HTML)) as unknown as typeof fetch

    const result = await scrapePage('http://example.com')
    expect(result.title).toBe('Test Page')
  })

  it('refuses to follow a redirect into a private host', async () => {
    global.fetch = vi.fn(async () => ({
      status: 302,
      ok: false,
      body: null,
      headers: new Headers({ location: 'http://169.254.169.254/latest/meta-data' }),
    })) as unknown as typeof fetch

    await expect(scrapePage('https://example.com')).rejects.toThrow(AuditRejectedError)
  })

  it('gives up after too many redirects', async () => {
    global.fetch = vi.fn(async () => ({
      status: 302,
      ok: false,
      body: null,
      headers: new Headers({ location: 'https://example.com/next' }),
    })) as unknown as typeof fetch

    await expect(scrapePage('https://example.com')).rejects.toThrow('Too many redirects')
  })

  it('rejects literal private/internal IPs without a DNS lookup', async () => {
    await expect(scrapePage('http://localhost/admin')).rejects.toThrow(AuditRejectedError)
    await expect(scrapePage('http://127.0.0.1/admin')).rejects.toThrow(AuditRejectedError)
    await expect(scrapePage('http://169.254.169.254/latest')).rejects.toThrow(AuditRejectedError)
    await expect(scrapePage('http://10.0.0.1/')).rejects.toThrow(AuditRejectedError)
    await expect(scrapePage('http://192.168.1.1/')).rejects.toThrow(AuditRejectedError)
  })

  it('rejects a public hostname that resolves to a private IP (DNS rebinding)', async () => {
    dnsLookup.mockResolvedValueOnce([{ address: '169.254.169.254', family: 4 }])
    await expect(scrapePage('http://attacker-controlled.example/')).rejects.toThrow(AuditRejectedError)
  })

  it('rejects an unresolvable hostname', async () => {
    dnsLookup.mockRejectedValueOnce(new Error('ENOTFOUND'))
    await expect(scrapePage('http://does-not-exist.invalid/')).rejects.toThrow('Could not resolve')
  })

  it('caps response size and rejects oversized bodies', async () => {
    const chunk = new TextEncoder().encode('a'.repeat(1024 * 1024)) // 1MB per chunk
    let reads = 0
    const reader = {
      read: async () => {
        reads += 1
        if (reads > 6) return { done: true, value: undefined } // >5MB total before this returns
        return { done: false, value: chunk }
      },
      cancel: async () => {},
    }
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      body: { getReader: () => reader },
    })) as unknown as typeof fetch

    await expect(scrapePage('https://example.com')).rejects.toThrow('too large')
  })
})

describe('isBlockedIp', () => {
  it('identifies private/reserved IPv4 addresses', () => {
    expect(isBlockedIp('127.0.0.1')).toBe(true)
    expect(isBlockedIp('10.0.0.1')).toBe(true)
    expect(isBlockedIp('172.16.0.1')).toBe(true)
    expect(isBlockedIp('192.168.1.1')).toBe(true)
    expect(isBlockedIp('169.254.169.254')).toBe(true)
    expect(isBlockedIp('100.64.0.1')).toBe(true)
    expect(isBlockedIp('0.0.0.0')).toBe(true)
  })

  it('identifies private/reserved IPv6 addresses', () => {
    expect(isBlockedIp('::1')).toBe(true)
    expect(isBlockedIp('fe80::1')).toBe(true)
    expect(isBlockedIp('fc00::1')).toBe(true)
    expect(isBlockedIp('fd12:3456::1')).toBe(true)
    expect(isBlockedIp('::ffff:169.254.169.254')).toBe(true)
  })

  it('allows public addresses', () => {
    expect(isBlockedIp('93.184.216.34')).toBe(false)
    expect(isBlockedIp('8.8.8.8')).toBe(false)
    expect(isBlockedIp('2606:4700:4700::1111')).toBe(false)
  })
})
