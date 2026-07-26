import { scrapePage, AuditRejectedError } from '../../../lib/scrape'
import { getPageSpeedScores } from '../../../lib/pagespeed'
import { analyzeWithClaude } from '../../../lib/analyze'
import type { AuditReport } from '../../../lib/types'

// A real 4-category PageSpeed run can legitimately take 20-120s+ depending on
// the target site, plus PSI's retry-on-500 behavior. Confirmed empirically that
// 120s wasn't enough for a real site (hit FUNCTION_INVOCATION_TIMEOUT at 121s) —
// 300s is Vercel Hobby's max allowed duration.
export const maxDuration = 300

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
