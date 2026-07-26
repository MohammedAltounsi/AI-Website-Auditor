import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getPageSpeedScores } from './pagespeed'

const SAMPLE_PSI_RESPONSE = {
  lighthouseResult: {
    categories: {
      performance: { score: 0.87 },
      accessibility: { score: 0.92 },
      seo: { score: 1 },
      'best-practices': { score: 0.75 },
    },
  },
}

describe('getPageSpeedScores', () => {
  beforeEach(() => {
    process.env.PAGESPEED_API_KEY = 'test-key'
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => SAMPLE_PSI_RESPONSE,
    })) as unknown as typeof fetch
  })

  afterEach(() => {
    delete process.env.PAGESPEED_API_KEY
  })

  it('converts lighthouse scores to 0-100 ints and computes a health score', async () => {
    const result = await getPageSpeedScores('https://example.com')
    expect(result).toEqual({
      performance: 87,
      accessibility: 92,
      seo: 100,
      bestPractices: 75,
      healthScore: 89,
    })
  })

  it('throws when the API key is missing', async () => {
    delete process.env.PAGESPEED_API_KEY
    await expect(getPageSpeedScores('https://example.com')).rejects.toThrow('PAGESPEED_API_KEY')
  })
})
