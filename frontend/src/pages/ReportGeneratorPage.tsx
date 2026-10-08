/**
 * Panel 15 — Automated Report Generation
 * Select type, mine, period → generate → preview sections → download.
 */
import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { FileText, Download, Loader2, CheckCircle2, AlertCircle, BarChart3, ArrowRight } from 'lucide-react'
import { ScrollReveal } from '@/components/common/ScrollReveal'
import { useFetch } from '@/hooks/useFetch'
import { reportsApi, sitesApi, type Report } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

const REPORT_TYPES = [
  { value:'geological',    label:'Geological Report',            color:'#00acc1' },
  { value:'machinery',     label:'Machinery Report',             color:'#7c4dff' },
  { value:'reserve',       label:'Reserve Verification Report',  color:'#29b6f6' },
  { value:'environmental', label:'Environmental Report',         color:'#43a047' },
  { value:'production',    label:'Production / Operational Report', color:'#00c853' },
  { value:'official',      label:'Official / Parliamentary Response', color:'#ffb300' },
]

function SectionPreview({ section }: { section: { title: string; data: unknown; note?: string } }) {
  const data = section.data
  if (!data || data === 'Data not available' || data === 'Insufficient source data') {
    return (
      <div className="mb-5">
        <h3 className="text-white font-semibold text-sm mb-2">{section.title}</h3>
        <p className="text-[#6b7280] text-xs italic">{String(data || 'No data')}</p>
      </div>
    )
  }
  if (Array.isArray(data) && data.length > 0) {
    const keys = Object.keys(data[0] as object).filter(k => !['id','siteId','sourceDoc','sourcePage'].includes(k)).slice(0,5)
    return (
      <div className="mb-5">
        <h3 className="text-white font-semibold text-sm mb-2">{section.title}</h3>
        <div className="overflow-x-auto rounded-lg border border-[#1c3828]">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-[#1c3828] bg-[#122318]/60">
              {keys.map(k=><th key={k} className="text-left px-3 py-2 text-[#6b7280] text-[10px] uppercase tracking-wide capitalize">{k.replace(/([A-Z])/g,' $1').trim()}</th>)}
            </tr></thead>
            <tbody>
              {(data as Record<string,unknown>[]).slice(0,6).map((row,i)=>(
                <tr key={i} className="border-b border-[#1c3828]/40 last:border-0">
                  {keys.map(k=><td key={k} className="px-3 py-2 text-[#9ab5a0]">{row[k]==null?'—':String(row[k]).slice(0,50)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {section.note && <p className="text-[#6b7280] text-[10px] mt-1.5 italic">{section.note}</p>}
      </div>
    )
  }
  return (
    <div className="mb-5">
      <h3 className="text-white font-semibold text-sm mb-2">{section.title}</h3>
      <p className="text-[#9ab5a0] text-xs">{typeof data === 'string' ? data : JSON.stringify(data).slice(0,200)}</p>
    </div>
  )
}

export function ReportGeneratorPage() {
  const { user }   = useAuth()
  const [params]   = useSearchParams()

  const [type,  setType]  = useState(params.get('type')  || 'production')
  const [dept,  setDept]  = useState(params.get('dept')  || user?.department || '')
  const [siteId,setSiteId]= useState('')
  const [period,setPeriod]= useState('2024-25')
  const [title, setTitle] = useState('')
  const [loading,setLoading] = useState(false)
  const [error,  setError]   = useState('')
  const [report, setReport]  = useState<Report|null>(null)

  const sitesQ = useFetch(() => sitesApi.list())
  const sites  = sitesQ.data?.sites || []

  const content = report?.content
    ? (() => { try { return typeof report.content === 'string' ? JSON.parse(report.content) : report.content } catch { return null } })()
    : null

  async function generate() {
    if (!type || !dept) { setError('Select a department and report type.'); return }
    setLoading(true); setError(''); setReport(null)
    const t = title || `${REPORT_TYPES.find(x=>x.value===type)?.label} — ${period}`
    try {
      const { report: r } = await reportsApi.generate({ title:t, type, department:dept, siteId:siteId||undefined, period })
      setReport(r)
    } catch(e:unknown) { setError(e instanceof Error?e.message:'Report generation failed.') }
    finally { setLoading(false) }
  }

  function exportReport() {
    if (!report||!content) return
    const secs = (content.sections||[]) as {title:string;data:unknown}[]
    const text = [
      report.title, '='.repeat(50), '',
      `Site: ${(content.site as {name:string})?.name||'All Sites'}`,
      `Period: ${report.period||'—'}`,
      `Generated: ${new Date(report.createdAt).toLocaleString()}`, '',
      'SUMMARY', '-'.repeat(40), report.summary||'', '',
      ...secs.flatMap(s=>[s.title.toUpperCase(),'-'.repeat(30),typeof s.data==='string'?s.data:JSON.stringify(s.data,null,2),'']),
      'SOURCE REFERENCES', '-'.repeat(40),
      ...(content.sources||[]).map((s:{source?:string;doc?:string;page?:number},i:number)=>`[${i+1}] ${s.source||''} — ${s.doc||''}${s.page?` p.${s.page}`:''}`),'',
      content.disclaimer||'',
    ].join('\n')
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'text/plain'}))
    a.download=`${report.title.replace(/\s+/g,'_')}.txt`; a.click()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ScrollReveal className="mb-6">
        <p className="text-coal-green text-xs font-semibold tracking-widest uppercase mb-1">Automated Reports</p>
        <h1 className="text-white text-2xl font-bold">Generate Report</h1>
        <p className="text-[#6b7280] text-sm mt-1">Select parameters — LANZEY retrieves data and generates a structured report with source traceability.</p>
      </ScrollReveal>

      {/* Report type cards */}
      <ScrollReveal className="mb-5">
        <p className="text-[#6b7280] text-xs font-semibold uppercase tracking-widest mb-2">Select Report Type</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {REPORT_TYPES.map(rt=>(
            <button key={rt.value} onClick={()=>setType(rt.value)}
              className={`p-3 rounded-xl border text-left transition-all duration-150 ${type===rt.value?'border-['+rt.color+']/50 bg-['+rt.color+']/8':'border-[#1c3828] hover:border-[#1c3828]/80'}`}
              style={type===rt.value?{borderColor:`${rt.color}50`,background:`${rt.color}10`}:{}}>
              <p className="text-xs font-semibold" style={{color:type===rt.value?rt.color:'#9ab5a0'}}>{rt.label}</p>
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Config form */}
      {!report && (
        <ScrollReveal>
          <div className="rounded-xl border border-[#1c3828] p-5 mb-5" style={{background:'#0e1f16'}}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[#9ab5a0] text-xs mb-1.5">Department *</label>
                <input value={dept} onChange={e=>setDept(e.target.value)} placeholder="e.g. geological"
                  className="w-full bg-[#122318] border border-[#1c3828] rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-coal-green/50"/>
              </div>
              <div>
                <label className="block text-[#9ab5a0] text-xs mb-1.5">Mine / Site</label>
                <select value={siteId} onChange={e=>setSiteId(e.target.value)}
                  className="w-full bg-[#122318] border border-[#1c3828] rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none">
                  <option value="">All Sites</option>
                  {sites.map(s=><option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[#9ab5a0] text-xs mb-1.5">Reporting Period</label>
                <input value={period} onChange={e=>setPeriod(e.target.value)} placeholder="e.g. 2024-25"
                  className="w-full bg-[#122318] border border-[#1c3828] rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-coal-green/50"/>
              </div>
              <div>
                <label className="block text-[#9ab5a0] text-xs mb-1.5">Report Title (optional)</label>
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Auto-generated if blank"
                  className="w-full bg-[#122318] border border-[#1c3828] rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-coal-green/50"/>
              </div>
            </div>
            {error&&<div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 mb-4"><AlertCircle size={13} className="text-red-400"/><span className="text-red-400 text-xs">{error}</span></div>}
            <button onClick={generate} disabled={loading} className="btn-solid py-2.5 px-6 gap-2">
              {loading?<><Loader2 size={14} className="animate-spin"/>Generating...</>:<><BarChart3 size={14}/>Generate Report</>}
            </button>
          </div>
        </ScrollReveal>
      )}

      {/* Report preview */}
      {report && content && (
        <div className="animate-fade-up">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={15} className="text-coal-green animate-check-appear"/>
                <span className="text-coal-green text-xs font-semibold">Report Generated</span>
              </div>
              <h2 className="text-white text-xl font-bold">{report.title}</h2>
              <p className="text-[#6b7280] text-xs mt-1">{new Date(report.createdAt).toLocaleString()} · {report.period} · {(content.site as {name:string})?.name||'All Sites'}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={()=>setReport(null)} className="btn-secondary text-xs py-2 px-4">← New</button>
              <Link to={`/reports/validate/${report.id}`} className="btn-solid text-xs py-2 px-3 gap-1.5 inline-flex items-center">
                <CheckCircle2 size={12}/> Validate
              </Link>
              <button onClick={exportReport} className="btn-ghost text-xs py-2 px-3 gap-1.5">
                <Download size={12}/> Export
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-[#1c3828] p-5 mb-4" style={{background:'#0e1f16'}}>
            <p className="text-coal-green text-xs font-semibold uppercase tracking-widest mb-2">Executive Summary</p>
            <p className="text-[#9ab5a0] text-sm leading-relaxed">{report.summary}</p>
          </div>

          {/* Report Sections */}
          <div className="rounded-xl border border-[#1c3828] p-5 mb-4" style={{background:'#0e1f16'}}>
            <p className="text-coal-green text-xs font-semibold uppercase tracking-widest mb-4">Report Sections</p>
            {((content.sections||[]) as {title:string;data:unknown;note?:string}[]).map((s,i)=>(
              <SectionPreview key={i} section={s}/>
            ))}
          </div>

          {/* Sources */}
          {(content.sources as unknown[])?.length > 0 && (
            <div className="rounded-xl border border-[#1c3828] p-4 mb-4" style={{background:'#0e1f16'}}>
              <p className="text-coal-green text-xs font-semibold uppercase tracking-widest mb-3">Source References</p>
              {(content.sources as {source?:string;doc?:string;page?:number}[]).map((s,i)=>(
                <div key={i} className="flex items-start gap-3 py-2 border-b border-[#1c3828]/40 last:border-0">
                  <span className="text-[#6b7280] text-xs w-6">[{i+1}]</span>
                  <div>
                    <p className="text-white text-xs font-medium">{s.source||s.doc||'—'}</p>
                    {s.doc&&<p className="text-[#6b7280] text-[10px]">{s.doc}{s.page?` · p.${s.page}`:''}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[#6b7280] text-xs italic px-1">{content.disclaimer as string}</p>
        </div>
      )}
    </div>
  )
}
