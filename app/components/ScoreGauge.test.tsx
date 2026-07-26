import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreGauge } from './ScoreGauge'

describe('ScoreGauge', () => {
  beforeEach(() => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      now += 1000
      cb(now)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders the label and animates to the final score', () => {
    render(<ScoreGauge label="Performance" score={87} />)
    expect(screen.getByText('Performance')).toBeInTheDocument()
    expect(screen.getByText('87')).toBeInTheDocument()
  })

  it('supports a large size variant for the hero score', () => {
    render(<ScoreGauge label="Health Score" score={89} size="lg" />)
    expect(screen.getByText('89')).toBeInTheDocument()
  })
})
