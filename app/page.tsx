'use client'

import { useState } from 'react'
import { ReportView } from './components/ReportView'
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
    setLoading(false)
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold">AI Website Auditor</h1>
      <form onSubmit={handleSubmit} className="mt-6 flex gap-2 print:hidden">
        <input
          type="url"
          required
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Auditing…' : 'Audit'}
        </button>
      </form>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {report && <ReportView report={report} />}
    </main>
  )
}
