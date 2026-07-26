'use client'

import { useEffect, useState } from 'react'

const STAGES = [
  'Fetching page…',
  'Scanning for SEO signals…',
  'Running PageSpeed diagnostics…',
  'Analyzing with Claude…',
]

export function ScanningLoader() {
  const [stageIndex, setStageIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStageIndex((i) => (i + 1) % STAGES.length)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="font-data relative mt-6 overflow-hidden border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
      <span className="scan-sweep absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-accent-soft to-transparent" />
      <span className="relative">{STAGES[stageIndex]}</span>
      <span className="relative ml-1 animate-pulse text-accent">_</span>
    </div>
  )
}
