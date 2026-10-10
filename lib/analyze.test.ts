import { describe, it, expect, vi } from 'vitest'
import { analyzeWithClaude } from './analyze'
import type { ScrapeResult, PageSpeedResult } from './types'

const scrape: ScrapeResult = {
  title: 'Test',
  metaDescription: null,
  h1Count: 1,
  imageCount: 2,
  imagesMissingAlt: 1,
  hasCanonical: false,
  hasViewportMeta: true,
  wordCount: 120,
}

const pageSpeed: PageSpeedResult = { performance: 80, accessibility: 90, seo: 70, bestPractices: 85, healthScore: 81 }

function fakeClient(toolInput: unknown) {
  return {
    messages: {
      create: vi.fn(async () => ({
        content: [{ type: 'tool_use', name: 'submit_audit_report', input: toolInput }],
      })),
    },
  } as unknown as Parameters<typeof analyzeWithClaude>[3]
}

describe('analyzeWithClaude', () => {
  it('returns the parsed tool_use input', async () => {
    const expected = { summary: 'Solid site, missing alt text.', topFixes: [] }
    const result = await analyzeWithClaude('https://example.com', scrape, pageSpeed, fakeClient(expected))
    expect(result).toEqual(expected)
  })

  it('throws when Claude does not call the tool', async () => {
    const client = {
      messages: { create: vi.fn(async () => ({ content: [{ type: 'text', text: 'oops' }] })) },
    } as unknown as Parameters<typeof analyzeWithClaude>[3]
    await expect(analyzeWithClaude('https://example.com', scrape, pageSpeed, client)).rejects.toThrow('tool_use')
  })
})
