import { describe, it, expect } from 'vitest'
import { reportToCsv } from './exportCsv'
import type { AuditReport } from './types'

const report: AuditReport = {
  url: 'https://example.com',
  scrape: {
    title: 'T',
    metaDescription: null,
    h1Count: 1,
    imageCount: 0,
    imagesMissingAlt: 0,
    hasCanonical: true,
    hasViewportMeta: true,
    wordCount: 50,
  },
  pageSpeed: { performance: 90, accessibility: 90, seo: 90, bestPractices: 90, healthScore: 90 },
  summary: 'Great site',
  topFixes: [
    { category: 'seo', severity: 'high', issue: 'Missing meta description', fix: 'Add a 150-160 char meta description' },
  ],
}

describe('reportToCsv', () => {
  it('produces a header row plus one row per fix', () => {
    const csv = reportToCsv(report)
    const lines = csv.split('\n')
    expect(lines[0]).toBe('category,severity,issue,fix')
    expect(lines[1]).toBe('"seo","high","Missing meta description","Add a 150-160 char meta description"')
  })

  it('escapes embedded quotes', () => {
    const withQuote: AuditReport = {
      ...report,
      topFixes: [
        { category: 'ux', severity: 'low', issue: 'Uses the word "click here"', fix: 'Use descriptive link text' },
      ],
    }
    const csv = reportToCsv(withQuote)
    expect(csv).toContain('"Uses the word ""click here"""')
  })
})
