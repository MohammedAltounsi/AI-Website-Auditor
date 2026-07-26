import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapePage } from './scrape'

const SAMPLE_HTML = `
<html>
  <head>
    <title>Test Page</title>
    <meta name="description" content="A test page" />
    <link rel="canonical" href="https://example.com" />
    <meta name="viewport" content="width=device-width" />
  </head>
  <body>
    <h1>Hello</h1>
    <img src="a.jpg" alt="cat" />
    <img src="b.jpg" />
    <p>Some words here for the body text count.</p>
  </body>
</html>
`

describe('scrapePage', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => SAMPLE_HTML,
    })) as unknown as typeof fetch
  })

  it('extracts SEO signals from HTML', async () => {
    const result = await scrapePage('https://example.com')
    expect(result.title).toBe('Test Page')
    expect(result.metaDescription).toBe('A test page')
    expect(result.h1Count).toBe(1)
    expect(result.imageCount).toBe(2)
    expect(result.imagesMissingAlt).toBe(1)
    expect(result.hasCanonical).toBe(true)
    expect(result.hasViewportMeta).toBe(true)
  })

  it('throws when the fetch fails', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 404,
      text: async () => '',
    })) as unknown as typeof fetch
    await expect(scrapePage('https://example.com/missing')).rejects.toThrow('Failed to fetch')
  })
})
