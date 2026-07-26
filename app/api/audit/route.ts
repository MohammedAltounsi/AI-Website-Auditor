import { scrapePage } from '../../../lib/scrape'
import { getPageSpeedScores } from '../../../lib/pagespeed'
import { analyzeWithClaude } from '../../../lib/analyze'
import type { AuditReport } from '../../../lib/types'

export async function POST(request: Request) {
  const { url } = await request.json()

  if (typeof url !== 'string' || !url.startsWith('http')) {
    return Response.json({ error: 'A valid http(s) URL is required' }, { status: 400 })
  }

  try {
    const [scrape, pageSpeed] = await Promise.all([scrapePage(url), getPageSpeedScores(url)])
    const { summary, topFixes } = await analyzeWithClaude(url, scrape, pageSpeed)

    const report: AuditReport = { url, scrape, pageSpeed, summary, topFixes }
    return Response.json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audit failed'
    return Response.json({ error: message }, { status: 502 })
  }
}
