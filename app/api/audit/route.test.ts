import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'

vi.mock('../../../lib/scrape', () => ({
  scrapePage: vi.fn(async () => ({
    title: 'T',
    metaDescription: null,
    h1Count: 1,
    imageCount: 0,
    imagesMissingAlt: 0,
    hasCanonical: true,
    hasViewportMeta: true,
    wordCount: 50,
  })),
}))
vi.mock('../../../lib/pagespeed', () => ({
  getPageSpeedScores: vi.fn(async () => ({
    performance: 90,
    accessibility: 90,
    seo: 90,
    bestPractices: 90,
    healthScore: 90,
  })),
}))
vi.mock('../../../lib/analyze', () => ({
  analyzeWithClaude: vi.fn(async () => ({ summary: 'Great site', topFixes: [] })),
}))

describe('POST /api/audit', () => {
  it('returns 400 for a missing url', async () => {
    const req = new Request('http://localhost/api/audit', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns the assembled report for a valid url', async () => {
    const req = new Request('http://localhost/api/audit', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.url).toBe('https://example.com')
    expect(body.summary).toBe('Great site')
  })
})
