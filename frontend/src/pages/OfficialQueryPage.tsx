/**
 * Official Query Assistant (56.13 — Parliamentary/Official Query Feature)
 * Accepts natural language question, identifies mine + period, retrieves production data,
 * shows trend chart + source references, allows export as official response.
 */

import { useState } from 'react'
import { FileText, Send, Loader2, Download, BarChart3, AlertCircle } from 'lucide-react'
import { ScrollReveal } from '@/components/common/ScrollReveal'
import { queryApi, sitesApi, type OfficialQueryResult, type TrendPoint } from '@/services/api'
import { useFetch }     from '@/hooks/useFetch'
import { useReducedMotion } from '@/hooks'

function TrendBar({ trend, reduced }: { trend: TrendPoint[]; reduced: boolean }) {
  if (!trend.length) return null
  const max = Math.max(...trend.map(t => t.productionMT), 1)
  return (
    <div className="flex items-end gap-2 h-28 mt-4">
      {trend.map((t, i) => (
        <div key={t.year} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-coal-green text-[10px] font-semibold tabular-nums">
            {t.productionMT.toFixed(1)}
          </span>
          <div className="w-full rounded-t-sm bg-coal-border/50 flex-1 flex items-end overflow-hidden">
            <div className="w-full rounded-t-sm bg-coal-green/70 origin-bottom"
              style={{
                height: `${(t.productionMT / max) * 100}%`,
                transition: reduced ? 'none' : `height 700ms cubic-bezier(0.4,0,0.2,1) ${i*80}ms`,
              }}
            />
          </div>
          <span className="text-coal-muted text-[10px]">{t.year}</span>
        </div>
      ))}
    </div>
  )
}

const EXAMPLE_QUERIES = [
  'Show Nigahi Mine production trend for last 5 years',
  'What is Gevra Mine production data from 2020 to 2025?',
  'CCL Bhurkunda production last 3 years',
  'Production trend for all mines 2021 to 2025',
]

export function OfficialQueryPage() {
  const reduced  = useReducedMotion()
  const sitesQ   = useFetch(() => sitesApi.list())
  const sites    = sitesQ.data?.sites || []

  const [question,  setQuestion]  = useState('')
  const [mineName,  setMineName]  = useState('')
  const [fromYear,  setFromYear]  = useState(2020)
  const [toYear,    setToYear]    = useState(2025)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [result,    setResult]    = useState<OfficialQueryResult | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) { setError('Enter a question.'); return }
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await queryApi.official({
        question,
        mineName:  mineName || undefined,
        fromYear:  fromYear || undefined,
        toYear:    toYear   || undefined,
      })
      setResult(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Query failed.')
    } finally {
      setLoading(false)
    }
  }

  function exportResponse() {
    if (!result) return
    const text = [
      'OFFICIAL RESPONSE — LANZEY COAL INTELLIGENCE PORTAL',
      '═'.repeat(50),
      '',
      `Query: ${result.question}`,
      `Site:  ${result.siteName}`,
      `Period: ${result.fromYear}–${result.toYear}`,
      '',
      'PRODUCTION DATA',
      '─'.repeat(40),
      ...result.trend.map(t => `${t.year}: ${t.productionMT.toFixed(2)} MT`),
      '',
      'ANSWER',
      '─'.repeat(40),
      result.answer,
      '',
      'SOURCE REFERENCES',
      '─'.repeat(40),
      ...result.sources.map((s, i) => `[${i+1}] ${s.doc || '—'}${s.page ? ` (Page ${s.page})` : ''}`),
      '',
      `Confidence: ${Math.round(result.confidence * 100)}%`,
      `Generated: ${new Date().toLocaleString()} by LANZEY`,
    ].join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `official_response_${result.siteName.replace(/\s+/g,'_')}_${result.fromYear}-${result.toYear}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <ScrollReveal className="mb-8">
        <p className="text-coal-green text-xs font-semibold tracking-widest uppercase mb-1">
          Official Query Assistant
        </p>
        <h1 className="text-white text-2xl font-bold">Parliamentary Query Tool</h1>
        <p className="text-coal-muted text-sm mt-1">
          Ask production and data questions in natural language. LANZEY retrieves verified data, shows trends and generates source-referenced official responses.
        </p>
      </ScrollReveal>

      {/* Example queries */}
      <ScrollReveal className="flex flex-wrap gap-2 mb-6">
        {EXAMPLE_QUERIES.map(q => (
          <button key={q} onClick={() => { setQuestion(q); setMineName('') }}
            className="px-3 py-1.5 rounded-full text-xs border border-coal-border text-coal-subtle
                       hover:border-coal-green/40 hover:text-coal-green transition-all duration-150">
            {q}
          </button>
        ))}
      </ScrollReveal>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="bg-coal-card border border-coal-border rounded-xl overflow-hidden focus-within:border-coal-green/40 transition-colors duration-200">
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="e.g. Show Nigahi Mine production trend for last 5 years..."
            rows={3}
            className="w-full bg-transparent px-5 py-4 text-sm text-white placeholder:text-coal-muted resize-none focus:outline-none"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) } }}
          />
          {/* Optional filters */}
          <div className="px-4 pb-3 flex flex-wrap gap-3 items-end border-t border-coal-border/50 pt-3">
            <div>
              <label className="block text-coal-muted text-[10px] mb-1">Mine (optional)</label>
              <select value={mineName} onChange={e => setMineName(e.target.value)}
                className="bg-coal-surface border border-coal-border rounded px-2 py-1 text-white text-xs focus:outline-none">
                <option value="">Auto-detect</option>
                {sites.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-coal-muted text-[10px] mb-1">From Year</label>
              <input type="number" value={fromYear} onChange={e => setFromYear(+e.target.value)}
                min={2015} max={2026}
                className="w-20 bg-coal-surface border border-coal-border rounded px-2 py-1 text-white text-xs focus:outline-none" />
            </div>
            <div>
              <label className="block text-coal-muted text-[10px] mb-1">To Year</label>
              <input type="number" value={toYear} onChange={e => setToYear(+e.target.value)}
                min={2015} max={2026}
                className="w-20 bg-coal-surface border border-coal-border rounded px-2 py-1 text-white text-xs focus:outline-none" />
            </div>
            <button type="submit" disabled={loading || !question.trim()}
              className="btn-primary py-1.5 px-4 text-xs ml-auto">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {loading ? 'Searching...' : 'Submit Query'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 mb-6 animate-fade-in">
          <AlertCircle size={14} className="text-red-400" />
          <span className="text-red-400 text-xs">{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-fade-up">
          {/* Answer */}
          <div className="bg-coal-card border border-coal-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="ai-badge">
                  <span className="w-1.5 h-1.5 rounded-full bg-lanzey-green flex-shrink-0" />
                  Official Response
                </div>
                <span className="text-coal-muted text-xs">
                  {result.siteName} · {result.fromYear}–{result.toYear}
                </span>
              </div>
              {result.exportable && (
                <button onClick={exportResponse} className="btn-solid text-xs py-1.5 px-3">
                  <Download size={12} /> Export
                </button>
              )}
            </div>
            <p className="text-coal-subtle text-sm leading-relaxed whitespace-pre-wrap">{result.answer}</p>

            {/* Trend chart */}
            {result.trend.some(t => t.productionMT > 0) && (
              <div>
                <div className="flex items-center gap-1.5 mt-4 mb-2">
                  <BarChart3 size={13} className="text-coal-muted" />
                  <span className="text-coal-muted text-xs">Production Trend (MT)</span>
                </div>
                <TrendBar trend={result.trend} reduced={reduced} />
              </div>
            )}
          </div>

          {/* Sources */}
          {result.sources.length > 0 && (
            <div className="bg-coal-surface border border-coal-border rounded-xl p-4">
              <p className="text-coal-green text-xs font-semibold uppercase tracking-widest mb-3">Source References</p>
              {result.sources.map((s, i) => (
                <div key={i} className="flex items-start gap-3 py-1.5 border-b border-coal-border/40 last:border-0">
                  <span className="text-coal-muted text-xs w-5">[{i+1}]</span>
                  <div>
                    <p className="text-white text-xs font-medium">{s.doc || 'Unknown document'}</p>
                    {s.page && <p className="text-coal-muted text-[10px]">Page {s.page}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Confidence */}
          <div className="flex items-center gap-3 p-3 bg-coal-surface border border-coal-border rounded-xl">
            <BarChart3 size={14} className="text-coal-green flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-coal-muted">Answer confidence</span>
                <span className="text-coal-green text-xs font-bold tabular-nums">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${result.confidence * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
