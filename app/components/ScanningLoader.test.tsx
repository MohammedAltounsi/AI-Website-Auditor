import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ScanningLoader } from './ScanningLoader'

describe('ScanningLoader', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the first stage immediately', () => {
    render(<ScanningLoader />)
    expect(screen.getByText('Fetching page…')).toBeInTheDocument()
  })

  it('cycles to the next stage after the interval', () => {
    vi.useFakeTimers()
    render(<ScanningLoader />)
    act(() => { vi.advanceTimersByTime(3500) })
    expect(screen.getByText('Scanning for SEO signals…')).toBeInTheDocument()
  })
})
