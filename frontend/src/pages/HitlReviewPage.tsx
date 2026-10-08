/**
 * Human-in-the-Loop (HITL) Verification Page
 *
 * Flow shown to user:
 *   AI extracts → AI validates → Exceptions flagged → CMPDI approves → Traceable report
 *
 * Features:
 *  - List all processed documents with their HITL status
 *  - Select a document → run AI validation → see verified fields + exceptions
 *  - Per-field: Approve / Correct (with new value) / Reject
 *  - Bulk "Approve All" for minor exceptions
 *  - Once all exceptions reviewed → HUMAN_VERIFIED badge
 *  - Link to generate report only available after HUMAN_VERIFIED
 */

import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  CheckCircle2, AlertCircle, XCircle, Brain, Loader2, RefreshCw,
  ChevronRight, FileText, ShieldCheck, ArrowRight, Edit3, Check,
  X, Info, AlertTriangle,
} from 'lucide-react'
import { ScrollReveal }    from '@/components/common/ScrollReveal'
import { ApiState }        from '@/components/common/ApiState'
import { KpiCard }         from '@/components/dashboard/KpiCard'
import { useFetch }        from '@/hooks/useFetch'
import {
  hitlApi, documentsApi,
  type HitlReview, type HitlField, type HitlPendingDoc,
} from '@/services/api'

// ── Status helpers ────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  NOT_SUBMITTED:   'Not Submitted',
  AUTO_VERIFIED:   'Auto-Verified',
  HAS_EXCEPTIONS:  'Has Exceptions',
  MINOR_EXCEPTIONS:'Minor Exceptions',
  CRITICAL_EXCEPTION:'Critical Exception',
  HUMAN_VERIFIED:  'Human Verified',
}
const STATUS_COLOR: Record<string, string> = {
  NOT_SUBMITTED:    'text-[#6b7280] border-[#1c3828] bg-[#122318]',
  AUTO_VERIFIED:    'text-coal-green border-coal-green/20 bg-coal-green/10',
  HAS_EXCEPTIONS:   'text-orange-400 border-orange-500/20 bg-orange-500/10',
  MINOR_EXCEPTIONS: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10',
  CRITICAL_EXCEPTION:'text-red-400 border-red-500/20 bg-red-500/10',
  HUMAN_VERIFIED:   'text-coal-green border-coal-green/30 bg-coal-green/15',
}
const SEV_COLOR: Record<string, string> = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  medium:   'text-yellow-400',
  low:      'text-[#6b7280]',
}
const SEV_ICON: Record<string, React.ReactNode> = {
  critical: <XCircle size={12} className="text-red-400 flex-shrink-0"/>,
  high:     <AlertCircle size={12} className="text-orange-400 flex-shrink-0"/>,
  medium:   <AlertCircle size={12} className="text-yellow-400 flex-shrink-0"/>,
  low:      <Info size={12} className="text-[#6b7280] flex-shrink-0"/>,
}

// ── Pipeline step indicator ───────────────────────────────────────────
function PipelineSteps({ hitlStatus }: { hitlStatus: string }) {
  const steps = [
    { label: 'AI Extracts',      done: true },
    { label: 'AI Validates',     done: hitlStatus !== 'NOT_SUBMITTED' },
    { label: 'Exceptions Flagged', done: ['HAS_EXCEPTIONS','MINOR_EXCEPTIONS','CRITICAL_EXCEPTION','HUMAN_VERIFIED','AUTO_VERIFIED'].includes(hitlStatus) },
    { label: 'CMPDI Approves',   done: hitlStatus === 'HUMAN_VERIFIED' || hitlStatus === 'AUTO_VERIFIED' },
    { label: 'Traceable Report', done: hitlStatus === 'HUMAN_VERIFIED' || hitlStatus === 'AUTO_VERIFIED' },
  ]

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${
            step.done
              ? 'bg-coal-green/10 border-coal-green/25 text-coal-green'
              : 'bg-[#122318] border-[#1c3828] text-[#6b7280]'
          }`}>
            {step.done
              ? <CheckCircle2 size={10} className="flex-shrink-0"/>
              : <div className="w-2 h-2 rounded-full border border-[#1c3828]"/>
            }
            {step.label}
          </div>
          {i < steps.length - 1 && (
            <ArrowRight size={11} className={step.done ? 'text-coal-green' : 'text-[#1c3828]'}/>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Single field row ─────────────────────────────────────────────────
function FieldRow({
  field, fieldStatus, onApprove, onCorrect, onReject, isException,
}: {
  field:       HitlField
  fieldStatus: { action:string; correctedValue?:string|null; reviewedBy:string } | undefined
  onApprove:   (name:string) => void
  onCorrect:   (name:string, value:string) => void
  onReject:    (name:string) => void
  isException: boolean
}) {
  const [editing,    setEditing]    = useState(false)
  const [editValue,  setEditValue]  = useState(field.fieldValue)
  const [saving,     setSaving]     = useState(false)

  async function submitCorrection() {
    setSaving(true)
    await onCorrect(field.fieldName, editValue)
    setSaving(false)
    setEditing(false)
  }

  const reviewed = !!fieldStatus

  return (
    <div className={`rounded-xl border p-3.5 transition-all duration-200 ${
      reviewed
        ? fieldStatus.action === 'approve' || fieldStatus.action === 'correct'
          ? 'border-coal-green/20 bg-coal-green/[0.04]'
          : 'border-red-500/20 bg-red-500/[0.04]'
        : isException
        ? `border-orange-500/20 bg-orange-500/[0.03]`
        : 'border-[#1c3828] bg-[#122318]/30'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isException && !reviewed && SEV_ICON[field.severity||'low']}
          {reviewed && (fieldStatus.action === 'approve' || fieldStatus.action === 'correct')
            ? <CheckCircle2 size={12} className="text-coal-green flex-shrink-0"/>
            : reviewed && fieldStatus.action === 'reject'
            ? <XCircle size={12} className="text-red-400 flex-shrink-0"/>
            : !isException && <CheckCircle2 size={12} className="text-coal-green/50 flex-shrink-0"/>
          }
          <span className="text-white text-xs font-semibold capitalize">
            {field.fieldName.replace(/([A-Z])/g,' $1').trim()}
          </span>
        </div>

        {/* Action buttons — only show if not yet reviewed */}
        {!reviewed && isException && (
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={()=>onApprove(field.fieldName)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border border-coal-green/25 text-coal-green hover:bg-coal-green/10 transition-all">
              <Check size={9}/> Approve
            </button>
            <button onClick={()=>setEditing(v=>!v)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border border-[#29b6f6]/25 text-[#29b6f6] hover:bg-[#29b6f6]/10 transition-all">
              <Edit3 size={9}/> Correct
            </button>
            <button onClick={()=>onReject(field.fieldName)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-all">
              <X size={9}/> Reject
            </button>
          </div>
        )}

        {reviewed && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize flex-shrink-0 ${
            fieldStatus.action==='approve'||fieldStatus.action==='correct'
              ?'text-coal-green border-coal-green/20 bg-coal-green/10'
              :'text-red-400 border-red-500/20 bg-red-500/10'}`}>
            {fieldStatus.action}d by {fieldStatus.reviewedBy?.split(' ')[0]}
          </span>
        )}
      </div>

      {/* Value display */}
      <div className="flex items-center gap-2">
        <span className="text-[#6b7280] text-[10px]">Value:</span>
        {editing ? (
          <div className="flex items-center gap-1.5 flex-1">
            <input value={editValue} onChange={e=>setEditValue(e.target.value)}
              className="flex-1 bg-[#0e1f16] border border-[#29b6f6]/40 rounded px-2 py-1 text-white text-xs focus:outline-none"/>
            <button onClick={submitCorrection} disabled={saving}
              className="px-2 py-1 rounded bg-[#29b6f6]/20 border border-[#29b6f6]/30 text-[#29b6f6] text-[10px] font-semibold disabled:opacity-50">
              {saving?<Loader2 size={10} className="animate-spin"/>:'Save'}
            </button>
            <button onClick={()=>{setEditing(false);setEditValue(field.fieldValue)}}
              className="px-2 py-1 rounded bg-[#122318] text-[#6b7280] text-[10px]">Cancel</button>
          </div>
        ) : (
          <>
            <span className="text-white text-xs font-medium">
              {fieldStatus?.correctedValue || field.fieldValue}
            </span>
            {fieldStatus?.correctedValue && (
              <span className="text-[#6b7280] text-[10px] line-through">{field.fieldValue}</span>
            )}
          </>
        )}
      </div>

      {/* Exception reason */}
      {isException && field.issue && !reviewed && (
        <p className={`mt-1.5 text-[10px] ${SEV_COLOR[field.severity||'low']}`}>
          ⚠ {field.issue}
        </p>
      )}

      {/* Confidence bar for verified fields */}
      {!isException && typeof field.confidence === 'number' && (
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[#6b7280] text-[10px]">Confidence</span>
          <div className="flex-1 bg-[#1c3828] rounded-full h-1 overflow-hidden">
            <div className="h-full rounded-full bg-coal-green/60"
              style={{width:`${field.confidence*100}%`}}/>
          </div>
          <span className="text-[#9ab5a0] text-[10px]">{Math.round(field.confidence*100)}%</span>
        </div>
      )}
    </div>
  )
}

// ── Document HITL detail panel ────────────────────────────────────────
function DocHitlPanel({ docId, onVerified }: { docId: string; onVerified: () => void }) {
  const [submitting,   setSubmitting]   = useState(false)
  const [approvingAll, setApprovingAll] = useState(false)
  const [refreshKey,   setRefreshKey]   = useState(0)
  const [actionMsg,    setActionMsg]    = useState('')

  const hitlQ = useFetch(() => hitlApi.get(docId), [docId, refreshKey])
  const hitl  = hitlQ.data?.hitl
  const doc   = hitlQ.data?.document

  function refresh() { setRefreshKey(k=>k+1) }

  async function submitForReview() {
    setSubmitting(true)
    try {
      await hitlApi.submit(docId)
      refresh()
    } catch(e:unknown) { setActionMsg(e instanceof Error ? e.message : 'Failed.') }
    finally { setSubmitting(false) }
  }

  async function handleApproveField(fieldName: string) {
    await hitlApi.approveField(docId, fieldName)
    refresh()
    if (hitl?.exceptions?.length === 1) onVerified()
  }

  async function handleCorrectField(fieldName: string, correctedValue: string) {
    await hitlApi.correctField(docId, fieldName, correctedValue)
    refresh()
  }

  async function handleRejectField(fieldName: string) {
    await hitlApi.rejectField(docId, fieldName, 'Rejected by reviewer')
    refresh()
  }

  async function handleApproveAll() {
    setApprovingAll(true)
    try {
      await hitlApi.approveAll(docId, 'Bulk approved by reviewer')
      refresh()
      onVerified()
    } catch(e:unknown) { setActionMsg(e instanceof Error ? e.message : 'Failed.') }
    finally { setApprovingAll(false) }
  }

  const navigate = useNavigate()

  if (hitlQ.loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 size={24} className="text-coal-green animate-spin"/>
    </div>
  )

  const status          = hitl?.status || 'NOT_SUBMITTED'
  const exceptions      = hitl?.exceptions || []
  const verified        = hitl?.verified   || []
  const fieldStatuses   = hitl?.fieldStatuses || {}
  const pendingExceptions = exceptions.filter(e => !fieldStatuses[e.fieldName])
  const isFullyVerified = status === 'HUMAN_VERIFIED' || status === 'AUTO_VERIFIED'

  return (
    <div className="space-y-4">

      {/* Document info + pipeline status */}
      <div className="rounded-xl border border-[#1c3828] p-4" style={{background:'#0e1f16'}}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-white text-sm font-semibold">{doc?.originalName}</p>
            <p className="text-[#6b7280] text-xs mt-0.5 capitalize">{doc?.department || 'General'}</p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${STATUS_COLOR[status]||''}`}>
            {STATUS_LABEL[status]||status}
          </span>
        </div>

        {/* HITL pipeline */}
        <PipelineSteps hitlStatus={status}/>

        {/* Score bar */}
        {hitl && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#6b7280] text-xs">AI Validation Score</span>
              <span className="text-white text-xs font-bold">{hitl.score}/100</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill"
                style={{
                  width:`${hitl.score}%`,
                  background: hitl.score>=80?'#00c853':hitl.score>=60?'#ffb300':'#f44336',
                }}/>
            </div>
          </div>
        )}

        {/* Verified badge */}
        {isFullyVerified && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-coal-green/5 border border-coal-green/20">
            <ShieldCheck size={15} className="text-coal-green flex-shrink-0"/>
            <div>
              <p className="text-coal-green text-xs font-semibold">Human-in-the-Loop Verified</p>
              {hitl?.verifiedBy && (
                <p className="text-[#6b7280] text-[10px]">
                  Verified by {hitl.verifiedBy} · {hitl.verifiedAt ? new Date(hitl.verifiedAt).toLocaleString() : ''}
                </p>
              )}
            </div>
            <Link to="/reports/generate" className="ml-auto btn-solid text-xs py-1.5 px-3 gap-1.5 inline-flex items-center">
              Generate Report <ArrowRight size={11}/>
            </Link>
          </div>
        )}
      </div>

      {actionMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-fade-in">
          <AlertCircle size={12}/> {actionMsg}
        </div>
      )}

      {/* Not submitted yet */}
      {status === 'NOT_SUBMITTED' && (
        <div className="rounded-xl border border-[#1c3828] p-5 text-center" style={{background:'#0e1f16'}}>
          <Brain size={24} className="text-coal-green mx-auto mb-3"/>
          <p className="text-white text-sm font-semibold mb-1">Start AI Validation</p>
          <p className="text-[#6b7280] text-xs mb-4 max-w-xs mx-auto">
            AI will validate all extracted fields, check for anomalies and flag exceptions for your review.
          </p>
          <button onClick={submitForReview} disabled={submitting}
            className="btn-solid py-2.5 px-6 gap-2 mx-auto">
            {submitting
              ? <><Loader2 size={14} className="animate-spin"/> Validating...</>
              : <><Brain size={14}/> Run AI Validation</>}
          </button>
        </div>
      )}

      {/* Exceptions requiring review */}
      {status !== 'NOT_SUBMITTED' && pendingExceptions.length > 0 && (
        <div className="rounded-xl border border-orange-500/20 overflow-hidden" style={{background:'#0e1f16'}}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-orange-500/20 bg-orange-500/[0.04]">
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} className="text-orange-400"/>
              <p className="text-white text-sm font-semibold">
                Exceptions Requiring Review ({pendingExceptions.length})
              </p>
            </div>
            <button onClick={handleApproveAll} disabled={approvingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-coal-green/30 text-coal-green hover:bg-coal-green/10 transition-all disabled:opacity-50">
              {approvingAll ? <Loader2 size={11} className="animate-spin"/> : <Check size={11}/>}
              Approve All
            </button>
          </div>
          <div className="p-3 space-y-2">
            {exceptions.map(field => (
              <FieldRow key={field.fieldName} field={field}
                fieldStatus={fieldStatuses[field.fieldName]}
                onApprove={handleApproveField}
                onCorrect={handleCorrectField}
                onReject={handleRejectField}
                isException={true}/>
            ))}
          </div>
        </div>
      )}

      {/* All exceptions reviewed but not yet verified */}
      {status !== 'NOT_SUBMITTED' && pendingExceptions.length === 0 && exceptions.length > 0 && !isFullyVerified && (
        <div className="rounded-xl border border-coal-green/20 p-4 bg-coal-green/[0.04] text-center">
          <CheckCircle2 size={20} className="text-coal-green mx-auto mb-2"/>
          <p className="text-coal-green text-sm font-semibold">All exceptions reviewed</p>
          <p className="text-[#6b7280] text-xs mt-1">Document is now human-verified and ready for traceable report generation.</p>
        </div>
      )}

      {/* Verified fields */}
      {status !== 'NOT_SUBMITTED' && verified.length > 0 && (
        <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1c3828]">
            <CheckCircle2 size={13} className="text-coal-green"/>
            <p className="text-white text-sm font-semibold">Auto-Verified Fields ({verified.length})</p>
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {verified.map(field => (
              <FieldRow key={field.fieldName} field={field}
                fieldStatus={fieldStatuses[field.fieldName]}
                onApprove={()=>{}} onCorrect={()=>{}} onReject={()=>{}}
                isException={false}/>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main HITL Review Page ─────────────────────────────────────────────
export function HitlReviewPage() {
  const { docId: urlDocId } = useParams<{ docId?: string }>()
  const navigate = useNavigate()
  const [selectedDocId, setSelectedDocId] = useState<string>(urlDocId || '')
  const [refreshKey, setRefreshKey] = useState(0)

  const pendingQ = useFetch(() => hitlApi.pending(), [refreshKey])
  const docs     = pendingQ.data?.documents || []

  const totalVerified   = docs.filter(d => d.isVerified).length
  const totalExceptions = docs.filter(d => ['HAS_EXCEPTIONS','CRITICAL_EXCEPTION','MINOR_EXCEPTIONS'].includes(d.hitlStatus)).length
  const totalPending    = docs.filter(d => d.hitlStatus === 'NOT_SUBMITTED').length

  const onVerified = useCallback(() => { setRefreshKey(k=>k+1) }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ScrollReveal className="mb-6">
        <p className="text-coal-green text-xs font-semibold tracking-widest uppercase mb-1">Verification Pipeline</p>
        <h1 className="text-white text-2xl font-bold">Human-in-the-Loop Verification</h1>
        <p className="text-[#6b7280] text-sm mt-1">
          AI extracts → AI validates → Exceptions flagged →{' '}
          <span className="text-coal-green font-semibold">CMPDI approves</span> →{' '}
          <span className="text-white font-semibold">Traceable report</span>
        </p>

        {/* Pipeline explanation banner */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {[
            { step:'1', label:'OCR Extracts Fields', color:'#00c853'  },
            { step:'2', label:'AI Validates',        color:'#29b6f6'  },
            { step:'3', label:'Exceptions Flagged',  color:'#ffb300'  },
            { step:'4', label:'CMPDI Approves',      color:'#7c4dff'  },
            { step:'5', label:'Traceable Report',    color:'#00c853'  },
          ].map((s,i)=>(
            <div key={s.step} className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium"
                style={{borderColor:`${s.color}30`,background:`${s.color}10`,color:s.color}}>
                <span className="font-black">{s.step}</span> {s.label}
              </div>
              {i<4 && <ArrowRight size={11} className="text-[#1c3828]"/>}
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Docs"        value={docs.length}       delay={0}/>
        <KpiCard label="Human Verified"    value={totalVerified}     trend="up" delay={80}/>
        <KpiCard label="Need Review"       value={totalExceptions}   trend={totalExceptions>0?'up':'flat'} delay={160}/>
        <KpiCard label="Not Submitted"     value={totalPending}      delay={240}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Document list */}
        <div className="lg:col-span-2">
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1c3828]">
                <p className="text-white text-sm font-semibold">Documents</p>
                <button onClick={()=>setRefreshKey(k=>k+1)} className="btn-ghost text-xs"><RefreshCw size={11}/></button>
              </div>
              <ApiState loading={pendingQ.loading} error={pendingQ.error}
                empty={docs.length===0}
                emptyMsg="No processed documents. Upload and process documents first."
                onRetry={()=>setRefreshKey(k=>k+1)}>
                <div className="divide-y divide-[#1c3828]/50 max-h-[600px] overflow-y-auto">
                  {docs.map(doc => (
                    <button key={doc.id}
                      onClick={() => { setSelectedDocId(doc.id); navigate(`/hitl/${doc.id}`,{replace:true}) }}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors group ${selectedDocId===doc.id?'bg-coal-green/[0.06]':'hover:bg-coal-green/[0.03]'}`}>
                      <FileText size={13} className="text-[#6b7280] flex-shrink-0 mt-0.5"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{doc.originalName}</p>
                        <p className="text-[#6b7280] text-[10px] mt-0.5 capitalize">{doc.department||'General'}</p>
                        {doc.exceptionCount > 0 && doc.hitlStatus !== 'HUMAN_VERIFIED' && (
                          <p className="text-orange-400 text-[10px] mt-0.5">{doc.exceptionCount} exception(s)</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${STATUS_COLOR[doc.hitlStatus]||''}`}>
                          {STATUS_LABEL[doc.hitlStatus]||doc.hitlStatus}
                        </span>
                        {doc.hitlScore !== null && (
                          <span className="text-[#6b7280] text-[9px]">{doc.hitlScore}/100</span>
                        )}
                      </div>
                      <ChevronRight size={11} className="text-[#6b7280] mt-1 flex-shrink-0"/>
                    </button>
                  ))}
                </div>
              </ApiState>
            </div>
          </ScrollReveal>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {selectedDocId ? (
            <DocHitlPanel docId={selectedDocId} onVerified={onVerified}/>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-[#1c3828] text-center p-6"
              style={{background:'#0e1f16'}}>
              <ShieldCheck size={28} className="text-[#6b7280] mb-3"/>
              <p className="text-[#9ab5a0] text-sm font-medium">Select a document to review</p>
              <p className="text-[#6b7280] text-xs mt-1">Run AI validation and approve extracted fields</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
