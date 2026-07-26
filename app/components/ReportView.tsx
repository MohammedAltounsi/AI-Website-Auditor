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
    <section className="mt-12 space-y-8">
      <div className="stagger-in flex items-center justify-between border-b border-border pb-4 print:hidden">
        <p className="font-data text-xs uppercase tracking-widest text-fg-muted">
          Report — {new URL(report.url).hostname}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="font-data border border-border px-3 py-1 text-xs uppercase tracking-wide text-fg-muted transition-colors hover:border-accent hover:text-accent"
          >
            Download PDF
          </button>
          <button
            onClick={handleDownloadCsv}
            className="font-data border border-border px-3 py-1 text-xs uppercase tracking-wide text-fg-muted transition-colors hover:border-accent hover:text-accent"
          >
            Download CSV
          </button>
        </div>
      </div>

      <div className="stagger-in flex justify-center" style={{ animationDelay: '80ms' }}>
        <ScoreGauge label="Health Score" score={report.pageSpeed.healthScore} size="lg" />
      </div>

      <div
        className="stagger-in grid grid-cols-2 gap-6 border-y border-border py-6 md:grid-cols-4"
        style={{ animationDelay: '160ms' }}
      >
        <ScoreGauge label="Performance" score={report.pageSpeed.performance} />
        <ScoreGauge label="Accessibility" score={report.pageSpeed.accessibility} />
        <ScoreGauge label="SEO" score={report.pageSpeed.seo} />
        <ScoreGauge label="Best Practices" score={report.pageSpeed.bestPractices} />
      </div>

      <p
        className="stagger-in text-xl leading-relaxed text-fg"
        style={{ animationDelay: '240ms' }}
      >
        {report.summary}
      </p>

      <ol className="space-y-3">
        {report.topFixes.map((fix, i) => (
          <li
            key={i}
            className="stagger-in border border-border bg-bg-elevated p-4"
            style={{ animationDelay: `${320 + i * 80}ms` }}
          >
            <div className="flex items-center gap-2">
              <SeverityBadge severity={fix.severity} />
              <span className="font-data text-xs uppercase tracking-widest text-fg-muted">
                {fix.category}
              </span>
            </div>
            <p className="mt-2 text-lg text-fg">{fix.issue}</p>
            <p className="font-data mt-1 text-sm text-fg-muted">{'→'} {fix.fix}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
