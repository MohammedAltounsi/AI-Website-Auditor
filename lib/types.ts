export interface ScrapeResult {
  title: string | null
  metaDescription: string | null
  h1Count: number
  imageCount: number
  imagesMissingAlt: number
  hasCanonical: boolean
  hasViewportMeta: boolean
  wordCount: number
}

export interface PageSpeedResult {
  performance: number
  accessibility: number
  seo: number
  bestPractices: number
  healthScore: number
}

export interface AuditFinding {
  category: 'seo' | 'accessibility' | 'copywriting' | 'ux' | 'performance'
  severity: 'critical' | 'high' | 'medium' | 'low'
  issue: string
  fix: string
}

export interface AuditReport {
  url: string
  scrape: ScrapeResult
  pageSpeed: PageSpeedResult
  summary: string
  topFixes: AuditFinding[]
}
