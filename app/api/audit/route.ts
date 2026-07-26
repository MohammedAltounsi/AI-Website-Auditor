import { scrapePage, AuditRejectedError } from '../../../lib/scrape'
import { getPageSpeedScores } from '../../../lib/pagespeed'
import { analyzeWithClaude } from '../../../lib/analyze'
import type { AuditReport } from '../../../lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const url = body?.url

    if (typeof url !== 'string' || !/^https?:\/\/.+/.test(url)) {
      return Response.json({ error: 'A valid http(s) URL is required' }, { status: 400 })
    }

    const [scrape, pageSpeed] = await Promise.all([scrapePage(url), getPageSpeedScores(url)])
    const { summary, topFixes } = await analyzeWithClaude(url, scrape, pageSpeed)

    const report: AuditReport = { url, scrape, pageSpeed, summary, topFixes }
    return Response.json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Audit failed'
    const status = err instanceof AuditRejectedError ? 400 : 502
    return Response.json({ error: message }, { status })
  }
}
