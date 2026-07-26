import * as cheerio from 'cheerio'
import type { ScrapeResult } from './types'

const BLOCKED_RANGES = [
  /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^169\.254\./, /^0\./, /^::1$/, /^fc00:/, /^fe80:/,
  /^localhost$/i,
]

export function isPrivateHost(hostname: string): boolean {
  return BLOCKED_RANGES.some((r) => r.test(hostname))
}

export async function scrapePage(url: string): Promise<ScrapeResult> {
  const parsed = new URL(url)
  if (isPrivateHost(parsed.hostname)) {
    throw new Error('Auditing private/internal URLs is not allowed')
  }

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuditorBot/1.0)' },
    redirect: 'manual',
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }
  const html = await res.text()
  const $ = cheerio.load(html)

  const images = $('img')
  const imagesMissingAlt = images.filter((_, el) => !$(el).attr('alt')?.trim()).length
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()

  return {
    title: $('title').first().text().trim() || null,
    metaDescription: $('meta[name="description"]').attr('content')?.trim() || null,
    h1Count: $('h1').length,
    imageCount: images.length,
    imagesMissingAlt,
    hasCanonical: $('link[rel="canonical"]').length > 0,
    hasViewportMeta: $('meta[name="viewport"]').length > 0,
    wordCount: bodyText ? bodyText.split(' ').length : 0,
  }
}
