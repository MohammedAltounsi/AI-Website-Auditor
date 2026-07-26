const SEVERITY_STYLES: Record<string, string> = {
  critical:
    'text-sev-critical border-sev-critical/40 bg-sev-critical/10 before:content-["▲_"]',
  high: 'text-sev-high border-sev-high/40 bg-sev-high/10 before:content-["●_"]',
  medium:
    'text-sev-medium border-sev-medium/40 bg-sev-medium/10 before:content-["◆_"]',
  low: 'text-sev-low border-sev-low/40 bg-sev-low/10 before:content-["·_"]',
}

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`font-data inline-block border px-2 py-0.5 text-xs font-semibold tracking-wide ${
        SEVERITY_STYLES[severity] ?? 'border-border text-fg-muted'
      }`}
    >
      {severity.toUpperCase()}
    </span>
  )
}
