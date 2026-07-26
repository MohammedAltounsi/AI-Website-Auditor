import { scrapePage, AuditRejectedError } from '../../../lib/scrape'
import { getPageSpeedScores } from '../../../lib/pagespeed'
import { analyzeWithClaude } from '../../../lib/analyze'
import type { AuditReport } from '../../../lib/types'

// A real 4-category PageSpeed run can legitimately take 20-90s, plus PSI's
// retry-on-500 behavior — give this route more room than Vercel's default.
export const maxDuration = 120

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
