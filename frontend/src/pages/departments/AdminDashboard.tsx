/**
 * Panel 10 — Administrative Dashboard
 * Tabs: Overview | Report Review (AI analysis + approve/reject) | Users | Activity
 */
import { useState } from 'react'
import { UserCog, Users, RefreshCw, Trash2, Shield, Activity, FileText, Brain, CheckCircle2, XCircle, Loader2, Eye, BarChart3 } from 'lucide-react'
import { ScrollReveal } from '@/components/common/ScrollReveal'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { KpiCardSkeleton } from '@/components/common/Skeleton'
import { ApiState } from '@/components/common/ApiState'
import { DeptHeader } from '@/components/layout/DeptHeader'
import { useFetch } from '@/hooks/useFetch'
import { adminApi, reportsApi, validateApi, type LanzeyUser, type Report, type AiAnalysis } from '@/services/api'
import { Link } from 'react-router-dom'

type Tab = 'overview'|'reports'|'users'|'activity'

const ROLE_BADGE:Record<string,string> = {
  ADMIN:'bg-red-500/15 text-red-400 border-red-500/20', CIL:'bg-coal-green/10 text-coal-green border-coal-green/20',
  CMPDI:'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', GEOLOGICAL:'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  ENVIRONMENT:'bg-green-700/15 text-green-400 border-green-700/20', MACHINERY:'bg-purple-500/10 text-purple-400 border-purple-500/20',
  RESERVE_CHECKER:'bg-blue-500/10 text-blue-400 border-blue-500/20',
}
const TYPE_COLOR:Record<string,string> = {
  geological:'text-[#00acc1]', machinery:'text-[#7c4dff]', environmental:'text-[#43a047]',
  reserve:'text-[#29b6f6]', production:'text-coal-green', official:'text-[#ffb300]',
}

function ReportReviewRow({ report, onRefresh }: { report: Report; onRefresh: () => void }) {
  const [analyzing,  setAnalyzing]  = useState(false)
  const [analysis,   setAnalysis]   = useState<AiAnalysis|null>(null)
  const [approving,  setApproving]  = useState(false)
  const [rejecting,  setRejecting]  = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject,   setShowReject]   = useState(false)
  const [msg,          setMsg]          = useState('')

  async function analyze() {
    setAnalyzing(true)
    try { const {analysis:a}=await validateApi.analyze(report.id); setAnalysis(a) }
    catch { /* ignore */ }
    finally { setAnalyzing(false) }
  }
  async function approve() {
    setApproving(true)
    try { await validateApi.approve(report.id); setMsg('Approved'); onRefresh() }
    catch { /* ignore */ }
    finally { setApproving(false) }
  }
  async function reject() {
    if(!rejectReason.trim()) return
    setRejecting(true)
    try { await validateApi.reject(report.id,rejectReason); setMsg('Rejected'); setShowReject(false); onRefresh() }
    catch { /* ignore */ }
    finally { setRejecting(false) }
  }

  return (
    <div className="border-b border-[#1c3828]/50 last:border-0">
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-coal-green/[0.03] transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">{report.title}</p>
          <p className="text-[#6b7280] text-[10px] mt-0.5">
            {report.site?.name||'All Sites'} · {new Date(report.createdAt).toLocaleDateString()} · {report.generatedBy?.name}
          </p>
        </div>
        <span className={`text-[10px] font-semibold flex-shrink-0 ${TYPE_COLOR[report.type]||'text-[#6b7280]'}`}>{report.type}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${report.status==='APPROVED'?'text-coal-green border-coal-green/20':report.status==='DRAFT'?'text-red-400 border-red-500/20':'text-yellow-400 border-yellow-500/20'}`}>
          {report.status}
        </span>

        {msg
          ? <span className={`text-[10px] font-bold flex-shrink-0 ${msg==='Approved'?'text-coal-green':'text-red-400'}`}>{msg}</span>
          : report.status==='GENERATED' && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={analyze} disabled={analyzing} title="AI Analyze"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border border-[#1c3828] text-[#9ab5a0] hover:border-coal-green/40 hover:text-coal-green transition-all">
                {analyzing?<Loader2 size={10} className="animate-spin"/>:<Brain size={10}/>} Analyze
              </button>
              <button onClick={approve} disabled={approving} title="Approve"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border border-coal-green/25 text-coal-green hover:bg-coal-green/10 transition-all">
                {approving?<Loader2 size={10} className="animate-spin"/>:<CheckCircle2 size={10}/>} Approve
              </button>
              <button onClick={()=>setShowReject(v=>!v)} title="Reject"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-all">
                <XCircle size={10}/> Reject
              </button>
              <Link to={`/reports/validate/${report.id}`} title="Full review"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border border-[#1c3828] text-[#9ab5a0] hover:border-[#29b6f6]/40 hover:text-[#29b6f6] transition-all">
                <Eye size={10}/> Review
              </Link>
            </div>
          )
        }
      </div>

      {/* AI Analysis result inline */}
      {analysis && !msg && (
        <div className="mx-4 mb-3 p-3 rounded-xl border border-[#1c3828] animate-fade-in" style={{background:'#122318'}}>
          <div className="flex items-center gap-2 mb-2">
            <Brain size={11} className="text-coal-green"/>
            <span className="text-[10px] font-semibold text-white">AI Analysis</span>
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              analysis.recommendation==='APPROVE'?'text-coal-green border-coal-green/25 bg-coal-green/10':
              analysis.recommendation==='REVIEW'?'text-yellow-400 border-yellow-500/25 bg-yellow-500/10':
              'text-red-400 border-red-500/25 bg-red-500/10'}`}>
              Score {analysis.score}/100 — {analysis.recommendation}
            </span>
          </div>
          <p className="text-[#9ab5a0] text-[10px] mb-2">{analysis.summary}</p>
          <div className="space-y-1">
            {analysis.issues.slice(0,3).map((issue,i)=>(
              <p key={i} className={`text-[10px] flex items-start gap-1 ${
                issue.severity==='critical'?'text-red-400':issue.severity==='high'?'text-orange-400':'text-yellow-400'}`}>
                <span className="flex-shrink-0">•</span> [{issue.severity.toUpperCase()}] {issue.message}
              </p>
            ))}
            {analysis.issues.length>3 && <p className="text-[#6b7280] text-[10px]">+{analysis.issues.length-3} more issues...</p>}
          </div>
        </div>
      )}

      {/* Reject reason input */}
      {showReject && !msg && (
        <div className="mx-4 mb-3 flex gap-2 animate-fade-in">
          <input value={rejectReason} onChange={e=>setRejectReason(e.target.value)}
            placeholder="Rejection reason..."
            className="flex-1 bg-[#122318] border border-red-500/30 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none"/>
          <button onClick={reject} disabled={rejecting||!rejectReason.trim()}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/25 text-red-400 text-xs font-semibold disabled:opacity-40">
            {rejecting?<Loader2 size={11} className="animate-spin"/>:'Confirm'}
          </button>
        </div>
      )}
    </div>
  )
}

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const statsQ    = useFetch(()=>adminApi.stats())
  const usersQ    = useFetch(()=>adminApi.users())
  const activityQ = useFetch(()=>adminApi.activity())
  const reportsQ  = useFetch(()=>reportsApi.list({limit:'30'}))
  const [deletingId, setDeletingId] = useState<string|null>(null)

  const stats   = statsQ.data
  const users   = usersQ.data?.users||[]
  const logs    = activityQ.data?.logs||[]
  const reports = reportsQ.data?.reports||[]
  const pending = reports.filter(r=>r.status==='GENERATED')

  async function handleDelete(id:string) {
    if(!confirm('Delete user?')) return
    setDeletingId(id)
    try { await adminApi.deleteUser(id); usersQ.refetch() }
    catch(e:unknown) { alert(e instanceof Error?e.message:'Failed') }
    finally { setDeletingId(null) }
  }
  async function toggleActive(u:LanzeyUser) {
    try { await adminApi.updateUser(u.id,{active:!u.active}); usersQ.refetch() }
    catch(e:unknown) { alert(e instanceof Error?e.message:'Failed') }
  }

  const TABS: {key:Tab;label:string;badge?:number}[] = [
    {key:'overview',label:'Overview'},
    {key:'reports', label:'Report Review', badge:pending.length},
    {key:'users',   label:'Users'},
    {key:'activity',label:'Activity'},
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DeptHeader icon={<UserCog size={20}/>} color="#ec407a" dept="ADMIN"
        title="Administrative Dashboard"
        subtitle="System overview, report approvals, user management and audit activity"/>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        {statsQ.loading?Array.from({length:5}).map((_,i)=><KpiCardSkeleton key={i} delay={i*60}/>):<>
          <KpiCard label="Total Users"     value={stats?.users||0}             delay={0}/>
          <KpiCard label="Documents"       value={stats?.docs||0}              delay={60}/>
          <KpiCard label="Reports"         value={stats?.reports||0}           delay={120}/>
          <KpiCard label="Mine Sites"      value={stats?.sites||0}             delay={180}/>
          <KpiCard label="Pending Review"  value={pending.length} trend={pending.length>0?'up':'flat'} delay={240}/>
        </>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-[#1c3828]">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium relative transition-colors duration-150 flex items-center gap-2 ${tab===t.key?'text-coal-green border-b-2 border-coal-green -mb-px':'text-[#6b7280] hover:text-white'}`}>
            {t.label}
            {t.badge!==undefined && t.badge>0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 font-semibold">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab==='overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] p-5" style={{background:'#0e1f16'}}>
              <div className="flex items-center gap-2 mb-4">
                <Shield size={14} className="text-[#ec407a]"/>
                <p className="text-white text-sm font-semibold">Roles & Permissions</p>
              </div>
              <div className="space-y-2">
                {[
                  {role:'ADMIN',          perms:'Full system access',                    color:'#ec407a'},
                  {role:'CIL',            perms:'Reports, production, official queries', color:'#00c853'},
                  {role:'CMPDI',          perms:'Geological data, report review',        color:'#ffb300'},
                  {role:'GEOLOGICAL',     perms:'OCR uploads, seam data, analysis',     color:'#00acc1'},
                  {role:'ENVIRONMENT',    perms:'Compliance, monitoring, clearances',   color:'#43a047'},
                  {role:'MACHINERY',      perms:'Fleet, telemetry, maintenance',        color:'#7c4dff'},
                  {role:'RESERVE_CHECKER',perms:'Production data, reserve records',    color:'#29b6f6'},
                ].map(r=>(
                  <div key={r.role} className="flex items-center gap-3 py-2 border-b border-[#1c3828]/40 last:border-0">
                    <span className="text-xs font-semibold w-32" style={{color:r.color}}>{r.role}</span>
                    <span className="text-[#6b7280] text-xs">{r.perms}</span>
                    <span className="text-[#9ab5a0] text-[10px] ml-auto">{users.filter(u=>u.role===r.role).length}u</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={60} className="lg:col-span-2">
            <div className="rounded-xl border border-[#1c3828] p-5" style={{background:'#0e1f16'}}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={14} className="text-coal-green"/>
                <p className="text-white text-sm font-semibold">System Status</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {label:'Total Users',    value:stats?.users||0,     color:'#00c853'},
                  {label:'Documents',      value:stats?.docs||0,      color:'#29b6f6'},
                  {label:'Reports',        value:stats?.reports||0,   color:'#ffb300'},
                  {label:'Pending Approvals', value:pending.length,   color:'#ec407a'},
                  {label:'Open Risks',     value:stats?.openRisks||0, color:'#f44336'},
                  {label:'Mine Sites',     value:stats?.sites||0,     color:'#7c4dff'},
                ].map(s=>(
                  <div key={s.label} className="bg-[#122318] rounded-lg px-4 py-3 border border-[#1c3828]">
                    <p className="text-[#6b7280] text-[10px] mb-1">{s.label}</p>
                    <p className="text-2xl font-black" style={{color:s.color}}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      )}

      {/* ── REPORT REVIEW ── */}
      {tab==='reports' && (
        <div className="space-y-4">
          {pending.length>0 && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 animate-fade-in">
              <Brain size={14} className="text-yellow-400"/>
              <p className="text-white text-sm">{pending.length} report{pending.length>1?'s':''} pending review. Run AI analysis before approving.</p>
            </div>
          )}
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c3828]">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-[#6b7280]"/>
                  <p className="text-white text-sm font-semibold">All Reports ({reports.length})</p>
                </div>
                <button onClick={reportsQ.refetch} className="btn-ghost text-xs"><RefreshCw size={11}/></button>
              </div>
              <ApiState loading={reportsQ.loading} error={reportsQ.error} empty={reports.length===0}
                emptyMsg="No reports found. Reports generated by departments will appear here." onRetry={reportsQ.refetch}>
                <div className="max-h-[600px] overflow-y-auto">
                  {reports.map(r=><ReportReviewRow key={r.id} report={r} onRefresh={reportsQ.refetch}/>)}
                </div>
              </ApiState>
            </div>
          </ScrollReveal>
        </div>
      )}

      {/* ── USERS ── */}
      {tab==='users' && (
        <ScrollReveal>
          <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c3828]">
              <div className="flex items-center gap-2"><Users size={13} className="text-[#6b7280]"/><p className="text-white text-sm font-semibold">Users ({users.length})</p></div>
              <button onClick={usersQ.refetch} className="btn-ghost text-xs"><RefreshCw size={11}/></button>
            </div>
            <ApiState loading={usersQ.loading} error={usersQ.error} empty={users.length===0} emptyMsg="No users.">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-[#1c3828]">
                    {['Name','Email','Role','Status','Actions'].map(h=>(
                      <th key={h} className="text-left px-4 py-2.5 text-[#6b7280] text-[10px] font-semibold uppercase tracking-wide">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {users.map(u=>(
                      <tr key={u.id} className="border-b border-[#1c3828]/40 last:border-0 hover:bg-coal-green/[0.03] transition-colors">
                        <td className="px-4 py-2.5 text-white font-medium">{u.name}</td>
                        <td className="px-4 py-2.5 text-[#9ab5a0] text-[11px]">{u.email}</td>
                        <td className="px-4 py-2.5"><span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${ROLE_BADGE[u.role]||''}`}>{u.role}</span></td>
                        <td className="px-4 py-2.5">
                          <button onClick={()=>toggleActive(u)}
                            className={`text-[10px] px-1.5 py-0.5 rounded border cursor-pointer ${u.active?'text-coal-green border-coal-green/20':'text-[#6b7280] border-[#1c3828]'}`}>
                            {u.active?'Active':'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <button onClick={()=>handleDelete(u.id)} disabled={deletingId===u.id}
                            className="text-[#6b7280] hover:text-red-400 transition-colors disabled:opacity-40">
                            <Trash2 size={12}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ApiState>
          </div>
        </ScrollReveal>
      )}

      {/* ── ACTIVITY ── */}
      {tab==='activity' && (
        <ScrollReveal>
          <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c3828]">
              <div className="flex items-center gap-2"><Activity size={13} className="text-[#6b7280]"/><p className="text-white text-sm font-semibold">System Activity</p></div>
              <button onClick={activityQ.refetch} className="btn-ghost text-xs"><RefreshCw size={11}/></button>
            </div>
            <ApiState loading={activityQ.loading} error={activityQ.error} empty={logs.length===0} emptyMsg="No activity logs.">
              <div className="divide-y divide-[#1c3828]/50 max-h-[500px] overflow-y-auto">
                {logs.map(log=>(
                  <div key={log.id} className="px-4 py-2.5 hover:bg-coal-green/[0.03] transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-coal-green">{log.action}</span>
                      <span className="text-[#6b7280] text-[10px]">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-[#9ab5a0] text-[11px]">{log.user?.name||'System'} · {log.entity||'—'}</p>
                  </div>
                ))}
              </div>
            </ApiState>
          </div>
        </ScrollReveal>
      )}
    </div>
  )
}
