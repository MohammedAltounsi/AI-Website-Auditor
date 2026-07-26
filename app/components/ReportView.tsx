import type { AuditReport } from '../../lib/types'
import { ScoreGauge } from './ScoreGauge'
import { SeverityBadge } from './SeverityBadge'
import { reportToCsv } from '../../lib/exportCsv'

export function ReportView({ report }: { report: AuditReport }) {
  function handleDownloadCsv() {
    const csv = reportToCsv(report)
    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit-${new URL(report.url).hostname}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <section className="mt-10 space-y-6">
      <div className="flex justify-end gap-2 print:hidden">
        <button onClick={() => window.print()} className="rounded border px-3 py-1 text-sm">
          Download PDF
        </button>
        <button onClick={handleDownloadCsv} className="rounded border px-3 py-1 text-sm">
          Download CSV
        </button>
      </div>

      <div className="flex justify-center">
        <ScoreGauge label="Health Score" score={report.pageSpeed.healthScore} size="lg" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <ScoreGauge label="Performance" score={report.pageSpeed.performance} />
        <ScoreGauge label="Accessibility" score={report.pageSpeed.accessibility} />
        <ScoreGauge label="SEO" score={report.pageSpeed.seo} />
        <ScoreGauge label="Best Practices" score={report.pageSpeed.bestPractices} />
      </div>

      <p className="text-lg">{report.summary}</p>

      <ol className="space-y-3">
        {report.topFixes.map((fix, i) => (
          <li key={i} className="rounded border p-3">
            <SeverityBadge severity={fix.severity} />
            <span className="ml-2 text-xs font-semibold uppercase text-gray-500">
              {fix.category}
            </span>
            <p className="font-medium">{fix.issue}</p>
            <p className="text-sm text-gray-600">Fix: {fix.fix}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
