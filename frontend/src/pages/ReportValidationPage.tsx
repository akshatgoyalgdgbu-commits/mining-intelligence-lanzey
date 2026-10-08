/**
 * Panel 15 inner — Report Validation
 * AI analysis of report content, section-by-section review, approve/reject.
 * AI checks: data completeness, source references, period, type-specific rules.
 */
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  CheckCircle2, AlertCircle, Download, ArrowLeft, Loader2,
  ThumbsUp, ThumbsDown, Brain, ShieldCheck, XCircle, BarChart3, Info,
} from 'lucide-react'
import { ScrollReveal } from '@/components/common/ScrollReveal'
import { ApiState }     from '@/components/common/ApiState'
import { useFetch }     from '@/hooks/useFetch'
import { validateApi, reportsApi, type AiAnalysis } from '@/services/api'

const SEV_COLOR: Record<string,string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  low:      'text-[#6b7280] bg-[#122318] border-[#1c3828]',
}
const SEV_ICON: Record<string,React.ReactNode> = {
  critical: <XCircle size={13} className="text-red-400 flex-shrink-0"/>,
  high:     <AlertCircle size={13} className="text-orange-400 flex-shrink-0"/>,
  medium:   <AlertCircle size={13} className="text-yellow-400 flex-shrink-0"/>,
  low:      <Info size={13} className="text-[#6b7280] flex-shrink-0"/>,
}

function ScoreRing({ score, recommendation }: { score: number; recommendation: string }) {
  const color = recommendation === 'APPROVE' ? '#00c853' : recommendation === 'REVIEW' ? '#ffb300' : '#f44336'
  const R = 36, C = 2 * Math.PI * R
  const dash = (score / 100) * C
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={96} height={96} viewBox="0 0 96 96">
        <circle cx={48} cy={48} r={R} fill="none" stroke="#1c3828" strokeWidth={10}/>
        <circle cx={48} cy={48} r={R} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${C-dash}`}
          style={{ transform:'rotate(-90deg)', transformOrigin:'48px 48px', transition:'stroke-dasharray 800ms ease' }}/>
        <text x={48} y={44} textAnchor="middle" className="fill-white text-[16px] font-black">{score}</text>
        <text x={48} y={57} textAnchor="middle" className="fill-[#6b7280] text-[9px]">/ 100</text>
      </svg>
      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
        recommendation==='APPROVE'?'text-coal-green border-coal-green/30 bg-coal-green/10':
        recommendation==='REVIEW' ?'text-yellow-400 border-yellow-500/30 bg-yellow-500/10':
        'text-red-400 border-red-500/30 bg-red-500/10'}`}>
        {recommendation}
      </span>
    </div>
  )
}

function SectionCard({ section }: { section: { title: string; data: unknown; note?: string } }) {
  const data = section.data
  if (!data || data === 'Data not available' || data === 'Insufficient source data') {
    return (
      <div className="mb-4 p-4 rounded-xl border border-[#1c3828]" style={{background:'#0e1f16'}}>
        <p className="text-white text-xs font-semibold mb-1">{section.title}</p>
        <p className="text-[#6b7280] text-xs italic">{String(data || 'No data available')}</p>
      </div>
    )
  }
  if (Array.isArray(data) && data.length > 0) {
    const keys = Object.keys(data[0] as object).filter(k => !['id','siteId'].includes(k)).slice(0,5)
    return (
      <div className="mb-4 p-4 rounded-xl border border-[#1c3828]" style={{background:'#0e1f16'}}>
        <p className="text-white text-xs font-semibold mb-2">{section.title}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-[#1c3828]">
              {keys.map(k=><th key={k} className="text-left px-2 py-1.5 text-[#6b7280] text-[10px] uppercase capitalize">{k.replace(/([A-Z])/g,' $1').trim()}</th>)}
            </tr></thead>
            <tbody>
              {(data as Record<string,unknown>[]).slice(0,5).map((row,i)=>(
                <tr key={i} className="border-b border-[#1c3828]/40 last:border-0">
                  {keys.map(k=><td key={k} className="px-2 py-1.5 text-[#9ab5a0]">{row[k]==null?'—':String(row[k]).slice(0,60)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
  return (
    <div className="mb-4 p-4 rounded-xl border border-[#1c3828]" style={{background:'#0e1f16'}}>
      <p className="text-white text-xs font-semibold mb-1">{section.title}</p>
      <p className="text-[#9ab5a0] text-xs">{typeof data==='string'?data:JSON.stringify(data).slice(0,200)}</p>
    </div>
  )
}

export function ReportValidationPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()

  const [analyzing,  setAnalyzing]  = useState(false)
  const [analysis,   setAnalysis]   = useState<AiAnalysis | null>(null)
  const [analyzeErr, setAnalyzeErr] = useState('')

  const [approving,  setApproving]  = useState(false)
  const [rejecting,  setRejecting]  = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [actionMsg,  setActionMsg]  = useState('')
  const [actionType, setActionType] = useState<'approve'|'reject'|''>('')
  const [approveComment, setApproveComment] = useState('')

  const reportQ = useFetch(() => reportsApi.get(id!), [id])
  const report  = reportQ.data?.report

  const rawContent = report?.content
  const content = rawContent
    ? (() => { try { return typeof rawContent === 'string' ? JSON.parse(rawContent as unknown as string) : rawContent } catch { return null } })()
    : null

  const sections: { title: string; data: unknown; note?: string }[] = content?.sections || []
  const sources:  { source?: string; doc?: string; page?: number }[] = content?.sources  || []
  const approval  = content?._approval
  const storedAnalysis = content?._aiAnalysis as AiAnalysis | undefined

  async function runAnalysis() {
    if (!id) return
    setAnalyzing(true); setAnalyzeErr(''); setAnalysis(null)
    try {
      const { analysis: a } = await validateApi.analyze(id)
      setAnalysis(a)
    } catch(e:unknown) { setAnalyzeErr(e instanceof Error ? e.message : 'Analysis failed.') }
    finally { setAnalyzing(false) }
  }

  async function handleApprove() {
    if (!id) return
    setApproving(true)
    try {
      await validateApi.approve(id, approveComment)
      setActionMsg('Report approved successfully.')
      setActionType('approve')
      reportQ.refetch()
    } catch(e:unknown) { setAnalyzeErr(e instanceof Error ? e.message : 'Approval failed.') }
    finally { setApproving(false) }
  }

  async function handleReject() {
    if (!id || !rejectReason.trim()) { setAnalyzeErr('Please enter a rejection reason.'); return }
    setRejecting(true)
    try {
      await validateApi.reject(id, rejectReason)
      setActionMsg('Report rejected and returned for revision.')
      setActionType('reject')
      setShowReject(false)
      reportQ.refetch()
    } catch(e:unknown) { setAnalyzeErr(e instanceof Error ? e.message : 'Rejection failed.') }
    finally { setRejecting(false) }
  }

  function exportReport() {
    if (!report || !content) return
    const text = [
      report.title, '='.repeat(50),
      `Site: ${content.site?.name||'All Sites'}`,
      `Period: ${report.period||'—'}`,
      `Status: ${report.status}`,
      `Generated: ${new Date(report.createdAt).toLocaleString()}`, '',
      'EXECUTIVE SUMMARY', '-'.repeat(40), report.summary||'', '',
      ...sections.flatMap(s=>[s.title.toUpperCase(), '-'.repeat(30),
        typeof s.data==='string'?s.data:JSON.stringify(s.data,null,2), '']),
      'SOURCE REFERENCES', '-'.repeat(40),
      ...sources.map((s,i)=>`[${i+1}] ${s.source||''} — ${s.doc||''}${s.page?` p.${s.page}`:''}`), '',
      content.disclaimer||'',
      ...(analysis ? [
        '', 'AI VALIDATION', '-'.repeat(40),
        `Score: ${analysis.score}/100`,
        `Recommendation: ${analysis.recommendation}`,
        `Summary: ${analysis.summary}`, '',
        'Issues:', ...analysis.issues.map(i=>`[${i.severity.toUpperCase()}] ${i.message}`),
        '', 'Passes:', ...analysis.passes.map(p=>`✓ ${p}`),
      ] : []),
    ].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    a.download = `${report.title.replace(/\s+/g,'_')}_VALIDATED.txt`
    a.click()
  }

  const displayAnalysis = analysis || storedAnalysis || null

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ScrollReveal className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={()=>navigate(-1)} className="btn-ghost text-xs gap-1.5 py-1.5 px-3">
            <ArrowLeft size={12}/> Back
          </button>
        </div>
        <p className="text-coal-green text-xs font-semibold tracking-widest uppercase mb-1">Report Validation</p>
        <h1 className="text-white text-2xl font-bold">AI Analysis & Approval</h1>
        <p className="text-[#6b7280] text-sm mt-1">
          Run AI analysis to validate report quality, check source traceability, then approve or reject.
        </p>
      </ScrollReveal>

      <ApiState loading={reportQ.loading} error={reportQ.error} empty={!report} emptyMsg="Report not found. It may have been deleted.">
        {report && (
          <>
            {/* Report header */}
            <div className="rounded-xl border border-[#1c3828] p-5 mb-5" style={{background:'#0e1f16'}}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-white text-lg font-bold mb-1">{report.title}</h2>
                  <p className="text-[#6b7280] text-sm">
                    {report.department} · {report.period||'All periods'} ·{' '}
                    {content?.site?.name||'All Sites'} ·{' '}
                    Generated {new Date(report.createdAt).toLocaleDateString()} by {report.generatedBy?.name||'System'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                      report.status==='APPROVED'?'text-coal-green border-coal-green/20 bg-coal-green/10':
                      report.status==='DRAFT'?'text-yellow-400 border-yellow-500/20 bg-yellow-500/10':
                      'text-[#6b7280] border-[#1c3828]'}`}>
                      {report.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border text-[#9ab5a0] border-[#1c3828] capitalize">
                      {report.type}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={exportReport} className="btn-ghost text-xs py-2 px-3 gap-1.5">
                    <Download size={12}/> Export
                  </button>
                </div>
              </div>

              {/* Approval status banner */}
              {approval && (
                <div className={`mt-4 flex items-start gap-3 p-3 rounded-xl border ${
                  approval.status==='APPROVED'?'bg-coal-green/5 border-coal-green/20':'bg-red-500/5 border-red-500/20'}`}>
                  {approval.status==='APPROVED'
                    ? <CheckCircle2 size={15} className="text-coal-green flex-shrink-0 mt-0.5"/>
                    : <XCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5"/>}
                  <div>
                    <p className={`text-xs font-semibold ${approval.status==='APPROVED'?'text-coal-green':'text-red-400'}`}>
                      {approval.status==='APPROVED'?'Approved':'Rejected'} by {approval.approvedBy||approval.rejectedBy} on {new Date(approval.approvedAt||approval.rejectedAt).toLocaleString()}
                    </p>
                    {(approval.comment||approval.reason) && (
                      <p className="text-[#9ab5a0] text-xs mt-0.5">{approval.comment||approval.reason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action message */}
            {actionMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl border mb-4 animate-fade-in ${
                actionType==='approve'?'bg-coal-green/5 border-coal-green/20 text-coal-green':'bg-red-500/5 border-red-500/20 text-red-400'}`}>
                {actionType==='approve'?<CheckCircle2 size={14}/>:<XCircle size={14}/>}
                <span className="text-sm font-medium">{actionMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Left: AI Analysis panel */}
              <div className="lg:col-span-1 space-y-4">

                {/* Run analysis button */}
                <ScrollReveal>
                  <div className="rounded-xl border border-[#1c3828] p-5" style={{background:'#0e1f16'}}>
                    <div className="flex items-center gap-2 mb-3">
                      <Brain size={15} className="text-coal-green"/>
                      <p className="text-white text-sm font-semibold">AI Analysis</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#122318] border border-[#1c3828] text-[#6b7280] ml-auto">AI ENGINE</span>
                    </div>
                    <p className="text-[#6b7280] text-xs mb-4 leading-relaxed">
                      Runs automated quality checks: data completeness, source traceability, section coverage, type-specific rules.
                    </p>

                    {analyzeErr && (
                      <div className="flex items-center gap-2 text-red-400 text-xs mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                        <AlertCircle size={12} className="flex-shrink-0"/> {analyzeErr}
                      </div>
                    )}

                    <button onClick={runAnalysis} disabled={analyzing}
                      className="w-full btn-solid py-2.5 px-4 gap-2 justify-center">
                      {analyzing
                        ? <><Loader2 size={14} className="animate-spin"/> Analyzing...</>
                        : <><Brain size={14}/> {displayAnalysis ? 'Re-run Analysis' : 'Run AI Analysis'}</>}
                    </button>
                  </div>
                </ScrollReveal>

                {/* Analysis result */}
                {displayAnalysis && (
                  <ScrollReveal>
                    <div className="rounded-xl border border-[#1c3828] p-5" style={{background:'#0e1f16'}}>
                      <div className="flex items-center justify-center mb-4">
                        <ScoreRing score={displayAnalysis.score} recommendation={displayAnalysis.recommendation}/>
                      </div>
                      <p className="text-[#9ab5a0] text-xs text-center leading-relaxed mb-4">{displayAnalysis.summary}</p>

                      {/* Score bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[#6b7280] text-xs">Quality Score</span>
                          <span className="text-white text-xs font-bold">{displayAnalysis.score}/100</span>
                        </div>
                        <div className="progress-bar">
                          <div className={`progress-bar-fill ${displayAnalysis.score>=80?'':'bg-yellow-400'}`}
                            style={{width:`${displayAnalysis.score}%`,
                              background:displayAnalysis.score>=80?'#00c853':displayAnalysis.score>=55?'#ffb300':'#f44336'}}/>
                        </div>
                      </div>

                      {/* Issues */}
                      {displayAnalysis.issues.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[#6b7280] text-[10px] font-semibold uppercase tracking-widest mb-2">Issues ({displayAnalysis.issues.length})</p>
                          <div className="space-y-1.5">
                            {displayAnalysis.issues.map((issue, i) => (
                              <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${SEV_COLOR[issue.severity]}`}>
                                {SEV_ICON[issue.severity]}
                                <span className="leading-snug">{issue.message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Passes */}
                      {displayAnalysis.passes.length > 0 && (
                        <div>
                          <p className="text-[#6b7280] text-[10px] font-semibold uppercase tracking-widest mb-2">Checks Passed ({displayAnalysis.passes.length})</p>
                          <div className="space-y-1">
                            {displayAnalysis.passes.map((p, i) => (
                              <div key={i} className="flex items-start gap-2 text-[10px] text-coal-green">
                                <CheckCircle2 size={11} className="flex-shrink-0 mt-0.5"/>
                                <span>{p}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollReveal>
                )}

                {/* Approve / Reject actions */}
                {report.status !== 'APPROVED' && !actionMsg && (
                  <ScrollReveal>
                    <div className="rounded-xl border border-[#1c3828] p-4 space-y-3" style={{background:'#0e1f16'}}>
                      <p className="text-white text-sm font-semibold">Decision</p>

                      {displayAnalysis && (
                        <p className={`text-xs px-3 py-2 rounded-lg border font-medium ${
                          displayAnalysis.recommendation==='APPROVE'?'bg-coal-green/10 border-coal-green/20 text-coal-green':
                          displayAnalysis.recommendation==='REVIEW' ?'bg-yellow-500/10 border-yellow-500/20 text-yellow-400':
                          'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                          AI recommends: <span className="font-bold">{displayAnalysis.recommendation}</span>
                        </p>
                      )}

                      {/* Approve comment */}
                      <input value={approveComment} onChange={e=>setApproveComment(e.target.value)}
                        placeholder="Approval comment (optional)"
                        className="w-full bg-[#122318] border border-[#1c3828] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-coal-green/40"/>

                      <button onClick={handleApprove} disabled={approving}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-coal-green/10 border border-coal-green/30 text-coal-green text-xs font-semibold hover:bg-coal-green/20 transition-all disabled:opacity-60">
                        {approving?<Loader2 size={13} className="animate-spin"/>:<ThumbsUp size={13}/>}
                        {approving?'Approving...':'Approve Report'}
                      </button>

                      <button onClick={()=>setShowReject(v=>!v)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all">
                        <ThumbsDown size={13}/> Reject & Return
                      </button>

                      {showReject && (
                        <div className="space-y-2 animate-fade-in">
                          <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason (required)..."
                            rows={3}
                            className="w-full bg-[#122318] border border-red-500/30 rounded-xl px-3 py-2 text-white text-xs focus:outline-none resize-none placeholder:text-[#6b7280]"/>
                          <button onClick={handleReject} disabled={rejecting||!rejectReason.trim()}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/25 transition-all disabled:opacity-40">
                            {rejecting?<Loader2 size={12} className="animate-spin"/>:<XCircle size={12}/>}
                            {rejecting?'Rejecting...':'Confirm Rejection'}
                          </button>
                        </div>
                      )}
                    </div>
                  </ScrollReveal>
                )}

                {report.status === 'APPROVED' && !actionMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-coal-green/5 border border-coal-green/20 text-coal-green text-sm font-semibold">
                    <ShieldCheck size={16}/> Report is Approved
                  </div>
                )}
              </div>

              {/* Right: Report content */}
              <div className="lg:col-span-2">
                <ScrollReveal>
                  <div className="rounded-xl border border-[#1c3828] p-5 mb-4" style={{background:'#0e1f16'}}>
                    <p className="text-coal-green text-xs font-semibold uppercase tracking-widest mb-2">Executive Summary</p>
                    <p className="text-[#9ab5a0] text-sm leading-relaxed">{report.summary || 'No summary available.'}</p>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={60}>
                  <div className="rounded-xl border border-[#1c3828] p-5 mb-4" style={{background:'#0e1f16'}}>
                    <p className="text-coal-green text-xs font-semibold uppercase tracking-widest mb-4">Report Sections</p>
                    {sections.length === 0
                      ? <p className="text-[#6b7280] text-xs italic">No sections found in this report.</p>
                      : sections.map((s, i) => <SectionCard key={i} section={s}/>)
                    }
                  </div>
                </ScrollReveal>

                {sources.length > 0 && (
                  <ScrollReveal delay={100}>
                    <div className="rounded-xl border border-[#1c3828] p-4" style={{background:'#0e1f16'}}>
                      <p className="text-coal-green text-xs font-semibold uppercase tracking-widest mb-3">
                        Source References ({sources.length})
                      </p>
                      {sources.map((s, i) => (
                        <div key={i} className="flex items-start gap-3 py-2 border-b border-[#1c3828]/40 last:border-0">
                          <span className="text-[#6b7280] text-xs w-6 flex-shrink-0">[{i+1}]</span>
                          <div>
                            <p className="text-white text-xs font-medium">{s.source || s.doc || '—'}</p>
                            {s.doc && <p className="text-[#6b7280] text-[10px]">{s.doc}{s.page ? ` · p.${s.page}` : ''}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollReveal>
                )}
              </div>
            </div>
          </>
        )}
      </ApiState>
    </div>
  )
}
