const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-[#8B2615] text-white',
  high: 'bg-[#C0341D] text-white',
  medium: 'bg-[#FCA429] text-black',
  low: 'bg-[#FDBC60] text-black',
}

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLES[severity] ?? 'bg-gray-300'}`}
    >
      {severity.toUpperCase()}
    </span>
  )
}
