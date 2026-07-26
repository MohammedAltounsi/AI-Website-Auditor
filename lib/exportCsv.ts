import type { AuditReport } from './types'

export function reportToCsv(report: AuditReport): string {
  const header = 'category,severity,issue,fix'
  const rows = report.topFixes.map((f) =>
    [f.category, f.severity, f.issue, f.fix].map((v) => {
      const escaped = v.replace(/"/g, '""')
      const safe = /^[=+\-@]/.test(escaped) ? `'${escaped}` : escaped
      return `"${safe}"`
    }).join(',')
  )
  return [header, ...rows].join('\n')
}
