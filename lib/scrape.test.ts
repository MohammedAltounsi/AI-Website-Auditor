import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapePage, isPrivateHost } from './scrape'

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
    expect(result.wordCount).toBeGreaterThan(0)
  })

  it('throws when the fetch fails', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 404,
      text: async () => '',
    })) as unknown as typeof fetch
    await expect(scrapePage('https://example.com/missing')).rejects.toThrow('Failed to fetch')
  })

  it('rejects private/internal URLs', async () => {
    await expect(scrapePage('http://localhost/admin')).rejects.toThrow('not allowed')
    await expect(scrapePage('http://127.0.0.1/admin')).rejects.toThrow('not allowed')
    await expect(scrapePage('http://169.254.169.254/latest')).rejects.toThrow('not allowed')
    await expect(scrapePage('http://10.0.0.1/')).rejects.toThrow('not allowed')
    await expect(scrapePage('http://192.168.1.1/')).rejects.toThrow('not allowed')
  })
})

describe('isPrivateHost', () => {
  it('identifies private hosts', () => {
    expect(isPrivateHost('localhost')).toBe(true)
    expect(isPrivateHost('127.0.0.1')).toBe(true)
    expect(isPrivateHost('10.0.0.1')).toBe(true)
    expect(isPrivateHost('192.168.1.1')).toBe(true)
    expect(isPrivateHost('169.254.169.254')).toBe(true)
  })

  it('allows public hosts', () => {
    expect(isPrivateHost('example.com')).toBe(false)
    expect(isPrivateHost('8.8.8.8')).toBe(false)
  })
})
