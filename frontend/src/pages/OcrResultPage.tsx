/**
 * Panel 12 — OCR & Extraction Result
 * Browse processed documents, view extracted fields, tabs for Info/Tables/Images/Metadata.
 */

import { useState } from 'react'
import { FileText, Search, Download, RefreshCw, ChevronRight, ShieldCheck } from 'lucide-react'
import { ScrollReveal }  from '@/components/common/ScrollReveal'
import { ApiState }      from '@/components/common/ApiState'
import { useFetch }      from '@/hooks/useFetch'
import { documentsApi, knowledgeApi, type Document } from '@/services/api'
import { Link } from 'react-router-dom'

type Tab = 'extracted' | 'tables' | 'images' | 'metadata'

function DocDetailPanel({ doc }: { doc: Document }) {
  const [tab, setTab] = useState<Tab>('extracted')
  const kbQ  = useFetch(() => knowledgeApi.forDocument(doc.id), [doc.id])
  const fields = kbQ.data?.entries || []

  const meta = doc.metadata
    ? (() => { try { return JSON.parse(doc.metadata as unknown as string) } catch { return null } })()
    : null

  const TABS: { key: Tab; label: string }[] = [
    { key: 'extracted', label: 'Extracted Information' },
    { key: 'tables',    label: 'Tables' },
    { key: 'images',    label: 'Images' },
    { key: 'metadata',  label: 'Metadata' },
  ]

  return (
    <div className="rounded-xl border border-[#1c3828] overflow-hidden animate-slide-in-right" style={{ background: '#0e1f16' }}>
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-[#1c3828]">
        <div className="min-w-0">
          <p className="text-coal-green text-[10px] font-semibold uppercase tracking-widest mb-1">Document Analysis Results</p>
          <p className="text-white text-sm font-semibold truncate">{doc.originalName}</p>
          <p className="text-[#6b7280] text-xs mt-0.5">
            {doc.department} · {new Date(doc.createdAt).toLocaleDateString()}
            {doc.processingProgress ? ` · ${doc.processingProgress}%` : ''}
          </p>
        </div>
        <button className="btn-solid text-xs py-1.5 px-3 gap-1.5 flex-shrink-0">
          <Download size={12} /> Download Extracted Data
        </button>
        <Link to={`/hitl/${doc.id}`}
          className="btn-primary text-xs py-1.5 px-3 gap-1.5 flex-shrink-0 inline-flex items-center"
          title="Start Human-in-the-Loop verification">
          <ShieldCheck size={12} /> HITL Verify
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1c3828]">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors duration-150 ${
              tab === t.key
                ? 'text-coal-green border-b-2 border-coal-green -mb-px'
                : 'text-[#6b7280] hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        {tab === 'extracted' && (
          <ApiState loading={kbQ.loading} error={kbQ.error}
            empty={fields.length === 0} emptyMsg="No fields extracted from this document yet.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fields.map(f => (
                <div key={f.id} className="bg-[#122318] rounded-lg px-3 py-2.5 border border-[#1c3828]">
                  <p className="text-[#6b7280] text-[10px] mb-0.5 capitalize">
                    {f.fieldName.replace(/([A-Z])/g,' $1').trim()}
                  </p>
                  <p className="text-white text-xs font-semibold truncate" title={f.fieldValue}>
                    {f.fieldValue.length > 40 ? f.fieldValue.slice(0,38)+'…' : f.fieldValue}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <div className="flex-1 bg-[#1c3828] rounded-full h-1 overflow-hidden">
                      <div className="h-full bg-coal-green rounded-full"
                        style={{ width: `${((f.confidence || 0.8) * 100)}%` }} />
                    </div>
                    <span className="text-[#6b7280] text-[9px]">{Math.round((f.confidence||0.8)*100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </ApiState>
        )}

        {tab === 'tables' && (
          <div className="text-center py-8">
            <p className="text-[#6b7280] text-xs">Table extraction available for Excel and structured PDF documents.</p>
            {meta?.fields && Object.keys(meta.fields).length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-[#1c3828]">
                    <th className="text-left px-3 py-2 text-[#6b7280]">Field</th>
                    <th className="text-left px-3 py-2 text-[#6b7280]">Value</th>
                  </tr></thead>
                  <tbody>
                    {Object.entries(meta.fields).map(([k,v]) => (
                      <tr key={k} className="border-b border-[#1c3828]/40">
                        <td className="px-3 py-2 text-[#9ab5a0] capitalize">{k}</td>
                        <td className="px-3 py-2 text-white">{String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        )}

        {tab === 'images' && (
          <div className="text-center py-8">
            <p className="text-[#6b7280] text-xs">Image extraction not available in current demo.</p>
          </div>
        )}

        {tab === 'metadata' && (
          <div className="space-y-2">
            {[
              ['Filename',    doc.filename],
              ['MIME Type',   doc.mimeType],
              ['Size',        `${(doc.sizeByes/1024).toFixed(1)} KB`],
              ['Status',      doc.status],
              ['Department',  doc.department || '—'],
              ['Uploaded',    new Date(doc.createdAt).toLocaleString()],
              ['Method',      meta?.method || '—'],
              ['Fields extracted', String(meta?.extractedFieldCount || 0)],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center gap-3 py-2 border-b border-[#1c3828]/40 last:border-0">
                <span className="text-[#6b7280] text-xs w-36 flex-shrink-0">{label}</span>
                <span className="text-white text-xs font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function OcrResultPage() {
  const [selected,  setSelected]  = useState<Document | null>(null)
  const [searchQ,   setSearchQ]   = useState('')
  const [statusF,   setStatusF]   = useState('READY')

  const docsQ = useFetch(() => documentsApi.list({ status: statusF, limit: '30' }), [statusF])
  const docs  = (docsQ.data?.documents || []).filter(d =>
    !searchQ || d.originalName.toLowerCase().includes(searchQ.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ScrollReveal className="mb-6">
        <p className="text-coal-green text-xs font-semibold tracking-widest uppercase mb-1">OCR Processing</p>
        <h1 className="text-white text-2xl font-bold">OCR & Extraction Results</h1>
        <p className="text-[#6b7280] text-sm mt-1">
          Browse processed documents and view AI-extracted structured information.
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left — doc list */}
        <div className="lg:col-span-2">
          <ScrollReveal>
            {/* Search + filter */}
            <div className="flex gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1 bg-[#122318] border border-[#1c3828] rounded-lg px-3 py-2">
                <Search size={12} className="text-[#6b7280]" />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search documents..." className="bg-transparent text-white text-xs focus:outline-none flex-1" />
              </div>
              <select value={statusF} onChange={e => setStatusF(e.target.value)}
                className="bg-[#122318] border border-[#1c3828] rounded-lg px-2 py-2 text-white text-xs focus:outline-none">
                {['READY','EXTRACTING','AI_ANALYSIS','ERROR',''].map(s => (
                  <option key={s} value={s}>{s || 'All'}</option>
                ))}
              </select>
              <button onClick={docsQ.refetch} className="p-2 text-[#6b7280] hover:text-white">
                <RefreshCw size={13} />
              </button>
            </div>

            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{ background: '#0e1f16' }}>
              <ApiState loading={docsQ.loading} error={docsQ.error}
                empty={docs.length === 0} emptyMsg="No processed documents found.">
                <div className="divide-y divide-[#1c3828]/50 max-h-[600px] overflow-y-auto">
                  {docs.map(doc => (
                    <button key={doc.id}
                      onClick={() => setSelected(doc)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group ${
                        selected?.id === doc.id ? 'bg-coal-green/[0.06]' : 'hover:bg-coal-green/[0.03]'}`}>
                      <FileText size={13} className="text-[#6b7280] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{doc.originalName}</p>
                        <p className="text-[#6b7280] text-[10px]">
                          {doc.department || 'General'} · {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0 font-medium ${
                        doc.status === 'READY' ? 'text-coal-green border-coal-green/20' : 'text-yellow-400 border-yellow-500/20'}`}>
                        {doc.status}
                      </span>
                      <ChevronRight size={11} className="text-[#6b7280]" />
                    </button>
                  ))}
                </div>
              </ApiState>
            </div>
          </ScrollReveal>
        </div>

        {/* Right — detail */}
        <div className="lg:col-span-3">
          {selected
            ? <DocDetailPanel doc={selected} />
            : (
              <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-[#1c3828] text-center p-6"
                style={{ background: '#0e1f16' }}>
                <FileText size={28} className="text-[#6b7280] mb-3" />
                <p className="text-[#9ab5a0] text-sm">Select a processed document</p>
                <p className="text-[#6b7280] text-xs mt-1">View extracted fields, tables and metadata</p>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}
