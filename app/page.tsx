'use client'

import { useState } from 'react'
import { ReportView } from './components/ReportView'
import { ScanningLoader } from './components/ScanningLoader'
import type { AuditReport } from '../lib/types'

export default function Home() {
  const [url, setUrl] = useState('')
  const [report, setReport] = useState<AuditReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setReport(null)

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const body = await res.json()

      if (!res.ok) {
        setError(body.error ?? 'Audit failed')
      } else {
        setReport(body)
      }
    } catch {
      setError('Audit failed — check your connection and try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 md:py-24">
      <p className="font-data text-xs uppercase tracking-[0.2em] text-accent print:hidden">
        system // website auditor
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-fg md:text-6xl">
        Run a full diagnostic
        <br />
        on any website.
      </h1>

      <form onSubmit={handleSubmit} className="mt-10 print:hidden">
        <label
          htmlFor="audit-url"
          className="font-data block text-xs uppercase tracking-widest text-fg-muted"
        >
          Target URL
        </label>
        <div className="mt-2 flex items-stretch border border-border bg-bg-elevated focus-within:border-accent">
          <span aria-hidden className="font-data flex items-center pl-4 text-accent">
            &gt;
          </span>
          <input
            id="audit-url"
            type="url"
            required
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="font-data w-full bg-transparent px-3 py-4 text-fg outline-none placeholder:text-fg-muted"
          />
          <button
            type="submit"
            disabled={loading}
            className="font-data shrink-0 bg-accent px-6 text-sm font-bold uppercase tracking-widest text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? 'Scanning' : 'Run Audit'}
          </button>
        </div>
      </form>

      {loading && <ScanningLoader />}
      {error && (
        <p className="font-data mt-6 border border-sev-critical/40 bg-sev-critical/10 px-4 py-3 text-sm text-sev-critical">
          {error}
        </p>
      )}
      {report && <ReportView report={report} />}

      <section className="mt-24 border-t border-border pt-10 print:hidden">
        <p className="font-data text-xs uppercase tracking-[0.2em] text-accent">
          about
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-fg md:text-3xl">
          What this actually does
        </h2>
        <p className="mt-4 max-w-2xl text-fg-muted">
          Paste a URL. This tool scrapes the page, pulls four Google PageSpeed
          scores, and hands both to Claude with a fixed output format. Claude
          writes the findings and fixes. It never invents the score — the
          Health Score is <code className="font-data text-fg">Math.round()</code> of
          the four PageSpeed numbers, computed in code, every time.
        </p>
        <p className="mt-4 max-w-2xl text-fg-muted">
          Built to show the pattern I use for every AI feature I ship: the
          model explains, the code decides anything that has to be
          consistent. No hallucinated scores, no drifting rubric between
          runs.
        </p>
        <p className="mt-4 max-w-2xl text-fg-muted">
          Stack: Next.js App Router, TypeScript, Tailwind, the Anthropic API
          with forced tool-use for structured output, Vitest for tests. Full
          source on{' '}
          <a
            href="https://github.com/MohammedAltounsi/AI-Website-Auditor"
            className="text-accent underline underline-offset-4 hover:opacity-80"
          >
            GitHub
          </a>
          .
        </p>
      </section>
    </main>
  )
}
