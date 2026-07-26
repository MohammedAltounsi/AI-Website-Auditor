import type { PageSpeedResult } from './types'

const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 1000

/**
 * PSI intermittently returns a 500 on real-world audits (confirmed empirically —
 * the identical request succeeds on retry), especially when all 4 categories are
 * requested together. A 4xx means the request itself is wrong, so only 5xx is retried.
 */
async function fetchWithRetry(url: string): Promise<Response> {
  let res: Response
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    res = await fetch(url)
    if (res.ok || res.status < 500 || attempt === MAX_ATTEMPTS) return res
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
  }
  return res!
}

export async function getPageSpeedScores(url: string): Promise<PageSpeedResult> {
  const apiKey = process.env.PAGESPEED_API_KEY
  if (!apiKey) {
    throw new Error('PAGESPEED_API_KEY is not set')
  }

  const params = new URLSearchParams({ url, key: apiKey, strategy: 'mobile' })
  ;['performance', 'accessibility', 'seo', 'best-practices'].forEach((c) => params.append('category', c))

  const res = await fetchWithRetry(`${PSI_ENDPOINT}?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`PageSpeed API failed: ${res.status}`)
  }
  const data = await res.json()
  const categories = data.lighthouseResult?.categories ?? {}
  const scoreOf = (key: string) => Math.round((categories[key]?.score ?? 0) * 100)

  const performance = scoreOf('performance')
  const accessibility = scoreOf('accessibility')
  const seo = scoreOf('seo')
  const bestPractices = scoreOf('best-practices')

  // ponytail: simple average, weighted formula when real users say so
  const healthScore = Math.round((performance + accessibility + seo + bestPractices) / 4)

  return { performance, accessibility, seo, bestPractices, healthScore }
}
