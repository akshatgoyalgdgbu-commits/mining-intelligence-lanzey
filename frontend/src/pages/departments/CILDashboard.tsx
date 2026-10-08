/**
 * Panel 4 variant — CIL Dashboard (Report Reviewer + Production overview)
 */
import { useState } from 'react'
import { Building2, FileText, RefreshCw, Eye, TrendingUp, CheckCircle2, Clock, AlertCircle, ThumbsUp, ThumbsDown, Loader2, Brain, XCircle } from 'lucide-react'
import { ScrollReveal } from '@/components/common/ScrollReveal'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { KpiCardSkeleton } from '@/components/common/Skeleton'
import { ApiState } from '@/components/common/ApiState'
import { DeptHeader } from '@/components/layout/DeptHeader'
import { useFetch } from '@/hooks/useFetch'
import { reportsApi, validateApi, productionApi, type Report, type AiAnalysis } from '@/services/api'
import { Link } from 'react-router-dom'
import { useReducedMotion } from '@/hooks'

const TYPE_COLOR: Record<string,string> = {
  geological:'text-[#00acc1] border-[#00acc1]/20 bg-[#00acc1]/10',
  machinery:'text-[#7c4dff] border-[#7c4dff]/20 bg-[#7c4dff]/10',
  environmental:'text-[#43a047] border-[#43a047]/20 bg-[#43a047]/10',
  reserve:'text-[#29b6f6] border-[#29b6f6]/20 bg-[#29b6f6]/10',
  production:'text-coal-green border-coal-green/20 bg-coal-green/10',
  official:'text-[#ffb300] border-[#ffb300]/20 bg-[#ffb300]/10',
}

// ── Inline report approval row ────────────────────────────────────────
function ReportRow({ report, onRefresh }: { report: Report; onRefresh: () => void }) {
  const [analyzing,  setAnalyzing]  = useState(false)
  const [analysis,   setAnalysis]   = useState<AiAnalysis|null>(null)
  const [approving,  setApproving]  = useState(false)
  const [rejecting,  setRejecting]  = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [reason,     setReason]     = useState('')
  const [msg,        setMsg]        = useState('')

  async function analyze() {
    setAnalyzing(true)
    try { const {analysis:a} = await validateApi.analyze(report.id); setAnalysis(a) }
    catch { /* ignore */ }
    finally { setAnalyzing(false) }
  }
  async function approve() {
    setApproving(true)
    try { await validateApi.approve(report.id); setMsg('✓ Approved'); onRefresh() }
    catch { /* ignore */ }
    finally { setApproving(false) }
  }
  async function reject() {
    if (!reason.trim()) return
    setRejecting(true)
    try { await validateApi.reject(report.id, reason); setMsg('✗ Rejected'); setShowReject(false); onRefresh() }
    catch { /* ignore */ }
    finally { setRejecting(false) }
  }

  return (
    <div className="border-b border-[#1c3828]/50 last:border-0">
      <div className="flex items-center gap-3 px-5 py-3 hover:bg-coal-green/[0.03] transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">{report.title}</p>
          <p className="text-[#6b7280] text-[10px] mt-0.5">{report.site?.name||'All Sites'} · {new Date(report.createdAt).toLocaleDateString()} · {report.generatedBy?.name}</p>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 capitalize ${TYPE_COLOR[report.type]||'text-[#6b7280] border-[#1c3828]'}`}>{report.type}</span>

        {msg ? (
          <span className={`text-[10px] font-bold flex-shrink-0 ${msg.startsWith('✓')?'text-coal-green':'text-red-400'}`}>{msg}</span>
        ) : report.status === 'APPROVED' ? (
          <span className="flex items-center gap-1 text-coal-green text-[10px] flex-shrink-0"><CheckCircle2 size={10}/>Approved</span>
        ) : report.status === 'GENERATED' ? (
          <div className="flex gap-1 flex-shrink-0">
            {/* AI Analyse first, then approve/reject appear */}
            {!analysis ? (
              <button onClick={analyze} disabled={analyzing}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border border-[#1c3828] text-[#9ab5a0] hover:border-coal-green/40 hover:text-coal-green transition-all">
                {analyzing?<Loader2 size={9} className="animate-spin"/>:<Brain size={9}/>}
                {analyzing?'Analysing...':'AI Analyse'}
              </button>
            ) : (
              <>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${
                  analysis.recommendation==='APPROVE'?'text-coal-green border-coal-green/25 bg-coal-green/10':
                  analysis.recommendation==='REVIEW'?'text-yellow-400 border-yellow-500/25 bg-yellow-500/10':
                  'text-red-400 border-red-500/25 bg-red-500/10'}`}>
                  {analysis.score}/100
                </span>
                <button onClick={approve} disabled={approving}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border border-coal-green/25 text-coal-green hover:bg-coal-green/10 transition-all">
                  {approving?<Loader2 size={9} className="animate-spin"/>:<ThumbsUp size={9}/>} Approve
                </button>
                <button onClick={()=>setShowReject(v=>!v)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-all">
                  <ThumbsDown size={9}/> Reject
                </button>
              </>
            )}
            <Link to={`/reports/validate/${report.id}`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border border-[#1c3828] text-[#9ab5a0] hover:border-[#29b6f6]/40 hover:text-[#29b6f6] transition-all">
              <Eye size={9}/> Full Review
            </Link>
          </div>
        ) : (
          <span className="flex items-center gap-1 text-[#6b7280] text-[10px]"><Clock size={10}/>{report.status}</span>
        )}
      </div>

      {/* AI score summary */}
      {analysis && !msg && (
        <div className="mx-5 mb-2 px-3 py-2 rounded-lg border border-[#1c3828] bg-[#122318]/60 animate-fade-in">
          <p className="text-[#9ab5a0] text-[10px]">{analysis.summary}</p>
          {analysis.issues.length > 0 && (
            <p className="text-yellow-400 text-[10px] mt-1">
              {analysis.issues.filter(i=>i.severity==='critical'||i.severity==='high').length} critical/high issue(s):
              {' '}{analysis.issues[0]?.message}
            </p>
          )}
        </div>
      )}

      {/* Reject reason input */}
      {showReject && !msg && (
        <div className="mx-5 mb-2 flex gap-2 animate-fade-in">
          <input value={reason} onChange={e=>setReason(e.target.value)}
            placeholder="Rejection reason (required)..."
            className="flex-1 bg-[#122318] border border-red-500/30 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none"/>
          <button onClick={reject} disabled={rejecting||!reason.trim()}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/25 text-red-400 text-xs font-semibold disabled:opacity-40">
            {rejecting?<Loader2 size={11} className="animate-spin"/>:'Confirm'}
          </button>
        </div>
      )}
    </div>
  )
}

export function CILDashboard() {
  const reduced = useReducedMotion()
  const [typeFilter, setTypeFilter] = useState('')
  const reportsQ = useFetch(() => reportsApi.list({ ...(typeFilter?{type:typeFilter}:{}), limit:'30' }), [typeFilter])
  const summaryQ = useFetch(() => productionApi.summary())
  const trendQ   = useFetch(() => productionApi.trend({ years:'3' }))
  const reports  = reportsQ.data?.reports||[]
  const summary  = summaryQ.data
  const trend    = trendQ.data?.trend||[]
  const pending  = reports.filter(r=>r.status==='GENERATED').length
  const approved = reports.filter(r=>r.status==='APPROVED').length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DeptHeader icon={<Building2 size={20}/>} color="#00c853" dept="CIL"
        title="CIL Review Dashboard"
        subtitle="Review and approve department reports, production overview and official queries"
        actions={<Link to="/query/official" className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5">Official Query</Link>}/>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryQ.loading?Array.from({length:4}).map((_,i)=><KpiCardSkeleton key={i} delay={i*80}/>):<>
          <KpiCard label="Total Reports"   value={reportsQ.data?.total||0}            delay={0}/>
          <KpiCard label="Pending Review"  value={pending}  trend={pending>0?'up':'flat'} delay={80}/>
          <KpiCard label="Approved"        value={approved} trend="up"                delay={160}/>
          <KpiCard label="Production (MT)" value={summary?.totalProductionMT||0} decimals={1} delay={240}/>
        </>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c3828]">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-[#6b7280]"/>
                  <p className="text-white text-sm font-semibold">Department Reports</p>
                  {pending>0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{pending} pending</span>}
                </div>
                <button onClick={reportsQ.refetch} className="btn-ghost text-xs"><RefreshCw size={11}/></button>
              </div>
              <div className="flex gap-1.5 px-4 py-2.5 border-b border-[#1c3828]/50 overflow-x-auto">
                {['','geological','machinery','environmental','reserve','production','official'].map(t=>(
                  <button key={t} onClick={()=>setTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-full text-xs border capitalize whitespace-nowrap transition-all ${typeFilter===t?'border-coal-green text-coal-green bg-coal-green/10':'border-[#1c3828] text-[#6b7280] hover:border-coal-green/40'}`}>
                    {t||'All'}
                  </button>
                ))}
              </div>
              <ApiState loading={reportsQ.loading} error={reportsQ.error} empty={reports.length===0}
                emptyMsg="No reports yet. Department reports will appear here." onRetry={reportsQ.refetch}>
                <div className="divide-y divide-[#1c3828]/50 max-h-96 overflow-y-auto">
                  {reports.map(r=>(
                    <ReportRow key={r.id} report={r} onRefresh={reportsQ.refetch}/>
                  ))}
                </div>
              </ApiState>
            </div>
          </ScrollReveal>
        </div>

        <div className="space-y-4">
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] p-5" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-white text-sm font-semibold">Production Snapshot</p>
                <TrendingUp size={13} className="text-coal-green"/>
              </div>
              <ApiState loading={trendQ.loading} error={trendQ.error} empty={trend.length===0} emptyMsg="No data.">
                <div className="space-y-2.5">
                  {[...trend].reverse().map(t=>{
                    const ach=t.targetMT>0?(t.productionMT/t.targetMT)*100:null
                    return (
                      <div key={t.year} className="flex items-center gap-3">
                        <span className="text-[#6b7280] text-xs w-10">{t.year}</span>
                        <div className="flex-1 bg-[#1c3828] rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${ach&&ach>=100?'bg-coal-green':'bg-coal-green/50'}`}
                            style={{width:`${Math.min(ach||50,100)}%`,transition:reduced?'none':'width 700ms ease-out'}}/>
                        </div>
                        <span className="text-coal-green text-xs font-bold w-16 text-right tabular-nums">{t.productionMT.toFixed(1)} MT</span>
                      </div>
                    )
                  })}
                </div>
              </ApiState>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="rounded-xl border border-[#1c3828] p-4" style={{background:'#0e1f16'}}>
              <p className="text-white text-sm font-semibold mb-3">Quick Actions</p>
              {[
                {label:'Official Query Assistant',href:'/query/official',desc:'Parliamentary responses'},
                {label:'Generate Production Report',href:'/reports/generate?type=production',desc:'Year-wise summary'},
                {label:'Generate Official Response',href:'/reports/generate?type=official',desc:'Govt. response format'},
                {label:'Ask LANZEY',href:'/ask',desc:'Query all documents'},
              ].map(a=>(
                <Link key={a.href} to={a.href} className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-[#122318] transition-colors group mb-1">
                  <div className="flex-1">
                    <p className="text-white text-xs font-medium group-hover:text-coal-green transition-colors">{a.label}</p>
                    <p className="text-[#6b7280] text-[10px]">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
