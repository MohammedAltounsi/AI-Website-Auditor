import * as cheerio from 'cheerio'
import type { ScrapeResult } from './types'

export async function scrapePage(url: string): Promise<ScrapeResult> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuditorBot/1.0)' },
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
