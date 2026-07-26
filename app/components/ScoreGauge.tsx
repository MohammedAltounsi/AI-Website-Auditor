'use client'

import { useEffect, useRef, useState } from 'react'

function colorFor(score: number): string {
  if (score >= 90) return 'var(--accent)'
  if (score >= 50) return 'var(--sev-medium)'
  return 'var(--sev-critical)'
}

export function ScoreGauge({
  label,
  score,
  size = 'sm',
}: {
  label: string
  score: number
  size?: 'sm' | 'lg'
}) {
  const [display, setDisplay] = useState(0)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    const duration = 900
    const start = performance.now()

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      setDisplay(Math.round(progress * score))
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick)
      }
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [score])

  const dimension = size === 'lg' ? 160 : 88
  const numberSize = size === 'lg' ? 'text-4xl' : 'text-xl'
  const color = colorFor(score)

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: dimension,
          height: dimension,
          background: `conic-gradient(${color} ${display * 3.6}deg, var(--border) 0deg)`,
        }}
      >
        <div
          className="absolute rounded-full bg-bg"
          style={{ width: dimension - 12, height: dimension - 12 }}
        />
        <span className={`font-data relative font-bold ${numberSize}`} style={{ color }}>
          {display}
        </span>
      </div>
      <span className="font-data text-xs uppercase tracking-widest text-fg-muted">{label}</span>
    </div>
  )
}
