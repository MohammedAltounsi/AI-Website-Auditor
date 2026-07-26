import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'
import { AuditRejectedError } from '../../../lib/scrape'

vi.mock('../../../lib/scrape', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/scrape')>('../../../lib/scrape')
  return {
    AuditRejectedError: actual.AuditRejectedError,
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
  }
})
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

  it('returns 400 when scraping is rejected as a policy violation', async () => {
    const { scrapePage } = await import('../../../lib/scrape')
    vi.mocked(scrapePage).mockRejectedValueOnce(new AuditRejectedError('Auditing private/internal URLs is not allowed'))

    const req = new Request('http://localhost/api/audit', {
      method: 'POST',
      body: JSON.stringify({ url: 'http://169.254.169.254' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 502 for an upstream fetch failure', async () => {
    const { scrapePage } = await import('../../../lib/scrape')
    vi.mocked(scrapePage).mockRejectedValueOnce(new Error('Failed to fetch https://example.com: 500'))

    const req = new Request('http://localhost/api/audit', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(502)
  })
})
