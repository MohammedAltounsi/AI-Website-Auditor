import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReportView } from './ReportView'
import type { AuditReport } from '../../lib/types'

const report: AuditReport = {
  url: 'https://example.com',
  scrape: {
    title: 'T',
    metaDescription: null,
    h1Count: 1,
    imageCount: 2,
    imagesMissingAlt: 1,
    hasCanonical: true,
    hasViewportMeta: true,
    wordCount: 100,
  },
  pageSpeed: { performance: 87, accessibility: 92, seo: 100, bestPractices: 75, healthScore: 89 },
  summary: 'Solid site, a few quick wins.',
  topFixes: [
    {
      category: 'accessibility',
      severity: 'critical',
      issue: 'Image missing alt text',
      fix: 'Add descriptive alt attributes',
    },
  ],
}

describe('ReportView', () => {
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

  it('renders the hero health score, sub-scores, summary, and fixes', () => {
    render(<ReportView report={report} />)
    expect(screen.getByText('89')).toBeInTheDocument()
    expect(screen.getByText('Health Score')).toBeInTheDocument()
    expect(screen.getByText('87')).toBeInTheDocument()
    expect(screen.getByText('Solid site, a few quick wins.')).toBeInTheDocument()
    expect(screen.getByText('CRITICAL')).toBeInTheDocument()
    expect(screen.getByText('Image missing alt text')).toBeInTheDocument()
  })

  it('renders download buttons', () => {
    render(<ReportView report={report} />)
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument()
  })
})
