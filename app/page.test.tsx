import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from './page'

describe('Home page', () => {
  it('submits a url and renders the report summary', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
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
        topFixes: [],
      }),
    })) as unknown as typeof fetch

    render(<Home />)
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
      target: { value: 'https://example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /audit/i }))

    await waitFor(() => expect(screen.getByText('Great site')).toBeInTheDocument())
  })

  it('shows the error message on a failed audit', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({ error: 'A valid http(s) URL is required' }),
    })) as unknown as typeof fetch

    render(<Home />)
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
      target: { value: 'https://example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /audit/i }))

    await waitFor(() => expect(screen.getByText('A valid http(s) URL is required')).toBeInTheDocument())
  })
})
