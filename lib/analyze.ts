import Anthropic from '@anthropic-ai/sdk'
import type { ScrapeResult, PageSpeedResult, AuditFinding } from './types'

const REPORT_TOOL = {
  name: 'submit_audit_report',
  description: 'Submit the website audit summary and prioritized fixes',
  input_schema: {
    type: 'object' as const,
    properties: {
      summary: { type: 'string', description: '2-3 sentence plain-English summary of the site health' },
      topFixes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string', enum: ['seo', 'accessibility', 'copywriting', 'ux', 'performance'] },
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            issue: { type: 'string' },
            fix: { type: 'string' },
          },
          required: ['category', 'severity', 'issue', 'fix'],
        },
      },
    },
    required: ['summary', 'topFixes'],
  },
}

export async function analyzeWithClaude(
  url: string,
  scrape: ScrapeResult,
  pageSpeed: PageSpeedResult,
  client: Anthropic = new Anthropic()
): Promise<{ summary: string; topFixes: AuditFinding[] }> {
  const message = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    tools: [REPORT_TOOL],
    tool_choice: { type: 'tool', name: 'submit_audit_report' },
    messages: [
      {
        role: 'user',
        content: `Audit this website and return the top 5 fixes ranked by impact.\n\nURL: ${url}\nScraped signals: ${JSON.stringify(scrape)}\nPageSpeed scores: ${JSON.stringify(pageSpeed)}`,
      },
    ],
  })

  const toolUse = message.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return a tool_use block')
  }

  return toolUse.input as { summary: string; topFixes: AuditFinding[] }
}
