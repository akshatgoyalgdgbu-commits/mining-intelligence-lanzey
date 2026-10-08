/**
 * DocumentUploadWidget — shared upload component for every department dashboard.
 * Uploads → polls status → shows live pipeline stages → extracted fields when READY.
 */

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Loader2, CheckCircle2, AlertCircle, ArrowRight, Database } from 'lucide-react'
import { documentsApi, knowledgeApi, type Document } from '@/services/api'

const STATUS_STEPS = [
  { status: 'UPLOADED',    label: 'Uploaded',    pct: 5  },
  { status: 'EXTRACTING',  label: 'OCR Extract', pct: 30 },
  { status: 'PROCESSING',  label: 'Processing',  pct: 55 },
  { status: 'AI_ANALYSIS', label: 'AI Analysis', pct: 75 },
  { status: 'INDEXED',     label: 'Indexing',    pct: 92 },
  { status: 'READY',       label: 'Ready',       pct: 100},
]

interface DocumentUploadWidgetProps {
  department: string
  siteId?:    string
  onReady?:   (doc: Document, fields: ExtractedField[]) => void
  compact?:   boolean
}

interface ExtractedField { fieldName: string; fieldValue: string }

export function DocumentUploadWidget({
  department, siteId, onReady, compact = false,
}: DocumentUploadWidgetProps) {
  const [uploading,  setUploading]  = useState(false)
  const [doc,        setDoc]        = useState<Document | null>(null)
  const [status,     setStatus]     = useState('')
  const [progress,   setProgress]   = useState(0)
  const [fields,     setFields]     = useState<ExtractedField[]>([])
  const [error,      setError]      = useState('')
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileRef  = useRef<HTMLInputElement>(null)

  // Poll until READY or ERROR
  useEffect(() => {
    if (!doc || status === 'READY' || status === 'ERROR') {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    pollRef.current = setInterval(async () => {
      try {
        const s = await documentsApi.status(doc.id)
        setStatus(s.status)
        setProgress(s.processingProgress || 0)
        if (s.status === 'READY') {
          clearInterval(pollRef.current!)
          const kb = await knowledgeApi.forDocument(doc.id).catch(() => ({ entries: [] }))
          setFields(kb.entries || [])
          onReady?.(doc, kb.entries || [])
        }
      } catch { /* ignore */ }
    }, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [doc, status, onReady])

  async function handleFile(file: File) {
    setUploading(true)
    setError('')
    setDoc(null)
    setFields([])
    setProgress(0)
    try {
      const { document: uploaded } = await documentsApi.upload(file, department, siteId)
      setDoc(uploaded)
      setStatus(uploaded.status)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const stepIdx = STATUS_STEPS.findIndex(s => s.status === status)

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <label className={`inline-flex items-center gap-1.5 btn-primary text-xs py-1.5 px-3 cursor-pointer ${uploading ? 'opacity-60' : ''}`}>
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {uploading ? 'Uploading...' : 'Upload Document'}
          <input ref={fileRef} type="file" className="hidden" disabled={uploading}
            accept=".pdf,.jpg,.jpeg,.png,.tiff,.xlsx,.xls,.doc,.docx,.txt"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </label>
        {doc && status !== 'READY' && status !== 'ERROR' && (
          <span className="text-lanzey-green text-xs animate-pulse">
            {STATUS_STEPS[stepIdx]?.label || status}… {progress}%
          </span>
        )}
        {status === 'READY' && (
          <span className="flex items-center gap-1 text-lanzey-green text-xs">
            <CheckCircle2 size={12} /> Ready — {fields.length} fields extracted
          </span>
        )}
        {error && <span className="text-red-400 text-xs">{error}</span>}
      </div>
    )
  }

  return (
    <div className="bg-coal-card border border-coal-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Upload size={15} className="text-coal-muted" />
        <p className="text-white text-sm font-semibold">Upload Document</p>
      </div>
      <p className="text-coal-muted text-xs mb-4">
        PDF, scanned images, Excel or Word. LANZEY automatically extracts structured fields.
      </p>

      {/* Drop zone */}
      {!doc && (
        <label className={[
          'flex flex-col items-center gap-3 border-2 border-dashed rounded-xl p-6 cursor-pointer',
          'transition-all duration-200',
          'border-coal-border hover:border-coal-green/40 hover:bg-coal-surface/40',
          uploading ? 'opacity-60 cursor-wait' : '',
        ].join(' ')}>
          {uploading
            ? <Loader2 size={24} className="text-coal-green animate-spin" />
            : <Upload size={24} className="text-coal-muted" />
          }
          <div className="text-center">
            <p className="text-white text-xs font-semibold">
              {uploading ? 'Uploading...' : 'Click or drag to upload'}
            </p>
            <p className="text-coal-muted text-[10px] mt-0.5">PDF · Excel · Word · Images</p>
          </div>
          {error && (
            <div className="flex items-center gap-1 text-red-400 text-xs">
              <AlertCircle size={12} /> {error}
            </div>
          )}
          <input ref={fileRef} type="file" className="hidden" disabled={uploading}
            accept=".pdf,.jpg,.jpeg,.png,.tiff,.xlsx,.xls,.doc,.docx,.txt"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </label>
      )}

      {/* Live pipeline progress */}
      {doc && (
        <div className="mt-3 space-y-1.5 animate-fade-in">
          <p className="text-coal-muted text-xs mb-2 truncate">
            Processing: <span className="text-white font-medium">{doc.originalName}</span>
          </p>

          {/* Step progress bar */}
          <div className="flex gap-1 mb-2">
            {STATUS_STEPS.map((step, i) => (
              <div key={step.status}
                className={[
                  'flex-1 h-1.5 rounded-full transition-all duration-500',
                  i < stepIdx   ? 'bg-coal-green' :
                  i === stepIdx ? 'bg-coal-green/60 animate-progress-pulse' :
                                  'bg-coal-border',
                ].join(' ')}
                title={step.label}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className={`text-xs font-medium ${status === 'READY' ? 'text-coal-green' : status === 'ERROR' ? 'text-red-400' : 'text-coal-subtle'}`}>
              {status === 'READY'  ? '✓ Complete — document indexed' :
               status === 'ERROR' ? '✗ Processing failed' :
               `${STATUS_STEPS[stepIdx]?.label || status}… ${progress}%`}
            </p>
            <span className="text-coal-muted text-[10px]">{progress}%</span>
          </div>

          {/* Extracted fields once ready */}
          {status === 'READY' && fields.length > 0 && (
            <div className="mt-3 pt-3 border-t border-coal-border animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <p className="text-coal-green text-[10px] font-semibold uppercase tracking-widest">
                  {fields.length} Fields Extracted
                </p>
                <Link to={`/knowledge`}
                  className="text-[10px] text-coal-green hover:underline flex items-center gap-1">
                  <Database size={10} /> View all
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {fields.slice(0,6).map(f => (
                  <div key={f.fieldName} className="bg-coal-surface rounded px-2 py-1.5">
                    <p className="text-coal-muted text-[9px] capitalize">
                      {f.fieldName.replace(/([A-Z])/g,' $1').trim()}
                    </p>
                    <p className="text-white text-[10px] font-semibold truncate" title={f.fieldValue}>
                      {f.fieldValue.length > 25 ? f.fieldValue.slice(0,23)+'…' : f.fieldValue}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Link to="/ask" className="btn-ghost text-[10px] py-1 px-2 gap-1">Ask LANZEY</Link>
                <Link to="/reports/generate" className="btn-primary text-[10px] py-1 px-2 gap-1 ml-auto">
                  Generate Report <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          )}

          {/* Upload another */}
          {(status === 'READY' || status === 'ERROR') && (
            <button
              onClick={() => { setDoc(null); setStatus(''); setFields([]); setProgress(0) }}
              className="btn-ghost text-xs py-1 px-2 mt-1"
            >
              Upload another
            </button>
          )}
        </div>
      )}
    </div>
  )
}
