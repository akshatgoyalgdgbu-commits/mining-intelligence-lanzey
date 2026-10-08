/**
 * Panel 6 — Geological Dashboard
 * Site-wise mine selector, seam factor trends (thickness, GCV, ash per site),
 * OCR upload, seam analysis table, risk distribution donut.
 */
import { useState } from 'react'
import { Mountain, FileText, RefreshCw, Database, TrendingUp } from 'lucide-react'
import { ScrollReveal } from '@/components/common/ScrollReveal'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { KpiCardSkeleton } from '@/components/common/Skeleton'
import { ApiState } from '@/components/common/ApiState'
import { DeptHeader } from '@/components/layout/DeptHeader'
import { DocumentUploadWidget } from '@/components/common/DocumentUploadWidget'
import { useFetch } from '@/hooks/useFetch'
import { geologyApi, documentsApi, knowledgeApi, sitesApi, type Seam } from '@/services/api'
import { useNavigate, Link } from 'react-router-dom'
import { useReducedMotion } from '@/hooks'

function RiskDonut({ seams }: { seams: Seam[] }) {
  const data = [
    { label:'Thin (<5m)',   value:seams.filter(s=>(s.thickness||0)<5).length,   color:'#00c853' },
    { label:'Medium (5-10m)',value:seams.filter(s=>(s.thickness||0)>=5&&(s.thickness||0)<10).length, color:'#ffb300' },
    { label:'Thick (>10m)', value:seams.filter(s=>(s.thickness||0)>=10).length, color:'#f44336' },
  ]
  const total = data.reduce((s,d)=>s+d.value,0)||1
  let offset = 0
  const R=36, C=2*Math.PI*R
  return (
    <div className="flex items-center gap-4">
      <svg width={92} height={92} viewBox="0 0 92 92">
        <circle cx={46} cy={46} r={R} fill="none" stroke="#1c3828" strokeWidth={12}/>
        {data.map(d=>{
          const dash=(d.value/total)*C; const gap=C-dash
          const el=(<circle key={d.label} cx={46} cy={46} r={R} fill="none" stroke={d.color} strokeWidth={12}
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset}
            style={{transform:'rotate(-90deg)',transformOrigin:'46px 46px'}}/>)
          offset+=dash; return el
        })}
        <text x={46} y={46} textAnchor="middle" dominantBaseline="middle" className="fill-white text-[10px] font-bold">{total}</text>
      </svg>
      <div className="space-y-1.5">
        {data.map(d=>(
          <div key={d.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:d.color}}/>
            <span className="text-[#9ab5a0] text-xs">{d.label}</span>
            <span className="text-white text-xs font-bold ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FactorTrendChart({
  seams, factor, label, unit, color, reduced,
}: { seams:Seam[]; factor:keyof Seam; label:string; unit:string; color:string; reduced:boolean }) {
  // Group by site and compute average factor
  const bySite: Record<string,{name:string;values:number[]}> = {}
  for (const s of seams) {
    const key = s.site?.code || s.siteId || 'unknown'
    const val = s[factor] as number | undefined
    if (val == null) continue
    if (!bySite[key]) bySite[key] = { name: s.site?.name || key, values: [] }
    bySite[key].values.push(val)
  }
  const bars = Object.entries(bySite).map(([,v]) => ({
    name: v.name, avg: v.values.reduce((s,x)=>s+x,0)/v.values.length,
  })).sort((a,b)=>b.avg-a.avg).slice(0,6)

  if (bars.length === 0) return <p className="text-[#6b7280] text-xs py-3 text-center">No {label} data available.</p>
  const max = Math.max(...bars.map(b=>b.avg), 1)

  return (
    <div>
      <p className="text-[#9ab5a0] text-xs font-semibold mb-3">{label} by Mine (avg {unit})</p>
      <div className="space-y-2">
        {bars.map((b,i)=>(
          <div key={b.name} className="flex items-center gap-3">
            <span className="text-[#9ab5a0] text-[10px] w-28 truncate">{b.name}</span>
            <div className="flex-1 bg-[#1c3828] rounded-full h-2 overflow-hidden">
              <div className="h-full rounded-full"
                style={{
                  background: color,
                  width: `${(b.avg/max)*100}%`,
                  transition: reduced?'none':`width 700ms ease-out ${i*60}ms`,
                }}/>
            </div>
            <span className="text-white text-xs font-semibold tabular-nums w-14 text-right">{b.avg.toFixed(1)} {unit}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GeologicalDashboard() {
  const navigate = useNavigate()
  const reduced  = useReducedMotion()
  const [selectedSite, setSelectedSite] = useState('')
  const [factorTab, setFactorTab] = useState<'thickness'|'gcv'|'ash'>('thickness')

  const summaryQ = useFetch(() => geologyApi.summary())
  const seamsQ   = useFetch(() => geologyApi.seams(selectedSite ? { siteId: selectedSite } : {}), [selectedSite])
  const docsQ    = useFetch(() => documentsApi.list({ department:'geological', limit:'8', ...(selectedSite?{siteId:selectedSite}:{}) }), [selectedSite])
  const kbQ      = useFetch(() => knowledgeApi.summary({ department:'geological' }))
  const sitesQ   = useFetch(() => sitesApi.list())

  const summary  = summaryQ.data
  const seams    = seamsQ.data?.seams  || []
  const docs     = docsQ.data?.documents || []
  const sites    = sitesQ.data?.sites  || []

  const FACTORS = [
    { key:'thickness' as const, label:'Seam Thickness', unit:'m',       field:'thickness' as keyof Seam, color:'#00c853' },
    { key:'gcv'       as const, label:'GCV',             unit:'kcal/kg', field:'gcv' as keyof Seam,       color:'#29b6f6' },
    { key:'ash'       as const, label:'Ash Content',     unit:'%',       field:'ashContent' as keyof Seam, color:'#ffb300' },
  ]
  const currentFactor = FACTORS.find(f => f.key === factorTab)!

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DeptHeader icon={<Mountain size={20}/>} color="#00acc1" dept="GEOLOGICAL"
        title="Geological Department Dashboard"
        subtitle="Mine-wise seam data, factor trends, OCR extraction and geological analysis"
        actions={
          <div className="flex gap-2">
            <Link to="/ocr-results" className="btn-ghost text-xs py-2 px-3 gap-1.5"><Database size={12}/> OCR Results</Link>
            <button onClick={()=>navigate('/reports/generate?dept=geological&type=geological')}
              className="btn-primary text-xs py-2 px-4" style={{borderColor:'#00acc1',color:'#00acc1'}}>
              Generate Report
            </button>
          </div>
        }/>

      {/* Site filter */}
      <ScrollReveal className="mb-5">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[#6b7280] text-xs">Mine Site:</span>
          <button onClick={()=>setSelectedSite('')}
            className={`px-3 py-1 rounded-full text-xs border transition-all ${!selectedSite?'border-[#00acc1] text-[#00acc1] bg-[#00acc1]/10':'border-[#1c3828] text-[#9ab5a0] hover:border-[#00acc1]/40'}`}>
            All Mines
          </button>
          {sites.map(s=>(
            <button key={s.id} onClick={()=>setSelectedSite(s.id)}
              className={`px-3 py-1 rounded-full text-xs border transition-all ${selectedSite===s.id?'border-[#00acc1] text-[#00acc1] bg-[#00acc1]/10':'border-[#1c3828] text-[#9ab5a0] hover:border-[#00acc1]/40'}`}>
              {s.code}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryQ.loading?Array.from({length:4}).map((_,i)=><KpiCardSkeleton key={i} delay={i*80}/>):<>
          <KpiCard label="Documents"     value={docsQ.data?.total||0}    delay={0}/>
          <KpiCard label="OCR Processed" value={docs.filter(d=>d.status==='READY').length} delay={80}/>
          <KpiCard label={selectedSite?'Site Seams':'Total Seams'} value={seams.length||summary?.totalSeams||0} delay={160}/>
          <KpiCard label="KB Entries"    value={kbQ.data?.total||0}      delay={240}/>
        </>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">

          {/* Factor Trends — mine-wise */}
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] p-5" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#00acc1]"/>
                  <p className="text-white text-sm font-semibold">Factor Trends — Mine-wise</p>
                </div>
                <div className="flex gap-1">
                  {FACTORS.map(f=>(
                    <button key={f.key} onClick={()=>setFactorTab(f.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${factorTab===f.key?'text-white bg-[#122318] border-[#1c3828]':'text-[#6b7280] border-transparent hover:text-white'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <ApiState loading={seamsQ.loading} error={seamsQ.error}
                empty={seams.length===0} emptyMsg="No seam data. Upload geological documents to see factor trends.">
                <FactorTrendChart seams={seams} factor={currentFactor.field} label={currentFactor.label}
                  unit={currentFactor.unit} color={currentFactor.color} reduced={reduced}/>
              </ApiState>
            </div>
          </ScrollReveal>

          {/* Seam analysis table */}
          <ScrollReveal delay={60}>
            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c3828]">
                <p className="text-white text-sm font-semibold">
                  {selectedSite ? `Seams — ${sites.find(s=>s.id===selectedSite)?.name}` : 'All Seams'}
                </p>
                <button onClick={seamsQ.refetch} className="btn-ghost text-xs"><RefreshCw size={11}/></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-[#1c3828]">
                    {['Mine','Seam','Thickness (m)','GCV (kcal/kg)','Ash %','Grade','Status'].map(h=>(
                      <th key={h} className="text-left px-4 py-2.5 text-[#6b7280] text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    <ApiState loading={seamsQ.loading} error={seamsQ.error}
                      empty={seams.length===0} emptyMsg="No seam data. Upload geological documents to populate.">
                      <>
                        {seams.slice(0,10).map(s=>(
                          <tr key={s.id} className="border-b border-[#1c3828]/40 last:border-0 hover:bg-coal-green/[0.03] transition-colors">
                            <td className="px-4 py-2.5 text-white font-medium">{s.site?.name||'—'}</td>
                            <td className="px-4 py-2.5 text-[#9ab5a0]">{s.seamName}</td>
                            <td className="px-4 py-2.5 text-coal-green font-semibold tabular-nums">{s.thickness?.toFixed(1)||'—'}</td>
                            <td className="px-4 py-2.5 text-[#29b6f6] tabular-nums">{s.gcv?.toFixed(0)||'—'}</td>
                            <td className="px-4 py-2.5 text-[#ffb300] tabular-nums">{s.ashContent?.toFixed(1)||'—'}</td>
                            <td className="px-4 py-2.5 text-[#ffb300] font-semibold">{s.gradeDesignation||'—'}</td>
                            <td className="px-4 py-2.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-coal-green/10 text-coal-green border border-coal-green/20">Analysed</span>
                            </td>
                          </tr>
                        ))}
                      </>
                    </ApiState>
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>

          {/* OCR Upload */}
          <ScrollReveal delay={80}>
            <DocumentUploadWidget department="geological"
              onReady={()=>{seamsQ.refetch();docsQ.refetch();kbQ.refetch()}}/>
          </ScrollReveal>
        </div>

        <div className="space-y-4">
          {/* Geological Risk Distribution */}
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] p-5" style={{background:'#0e1f16'}}>
              <p className="text-white text-sm font-semibold mb-4">Risk Distribution</p>
              <ApiState loading={seamsQ.loading} error={seamsQ.error} empty={seams.length===0} emptyMsg="No seam data.">
                <RiskDonut seams={seams}/>
              </ApiState>
            </div>
          </ScrollReveal>

          {/* Site data summary */}
          {selectedSite && (
            <ScrollReveal delay={40}>
              <div className="rounded-xl border border-[#00acc1]/25 p-4" style={{background:'#0e1f16',borderColor:'rgba(0,172,193,0.25)'}}>
                <p className="text-[#00acc1] text-xs font-semibold uppercase tracking-widest mb-3">
                  {sites.find(s=>s.id===selectedSite)?.name}
                </p>
                <div className="space-y-2">
                  {[
                    ['Seams',    String(seams.length)],
                    ['Avg Thickness', seams.length ? (seams.reduce((s,x)=>s+(x.thickness||0),0)/seams.length).toFixed(1)+' m' : '—'],
                    ['Avg GCV',  seams.filter(s=>s.gcv).length ? (seams.filter(s=>s.gcv).reduce((s,x)=>s+(x.gcv||0),0)/seams.filter(s=>s.gcv).length).toFixed(0)+' kcal/kg' : '—'],
                    ['Avg Ash',  seams.filter(s=>s.ashContent).length ? (seams.filter(s=>s.ashContent).reduce((s,x)=>s+(x.ashContent||0),0)/seams.filter(s=>s.ashContent).length).toFixed(1)+'%' : '—'],
                    ['Documents',String(docs.length)],
                  ].map(([l,v])=>(
                    <div key={l as string} className="flex items-center justify-between py-1.5 border-b border-[#1c3828]/40 last:border-0">
                      <span className="text-[#6b7280] text-xs">{l}</span>
                      <span className="text-white text-xs font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Recent documents */}
          <ScrollReveal delay={60}>
            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1c3828]">
                <div className="flex items-center gap-2">
                  <FileText size={13} className="text-[#6b7280]"/>
                  <p className="text-white text-sm font-semibold">Documents</p>
                </div>
                <Link to="/documents" className="text-coal-green text-xs hover:underline">View all</Link>
              </div>
              <ApiState loading={docsQ.loading} error={docsQ.error} empty={docs.length===0} emptyMsg="No documents yet.">
                <div className="divide-y divide-[#1c3828]/50 max-h-60 overflow-y-auto">
                  {docs.map(d=>(
                    <div key={d.id} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-coal-green/[0.03] transition-colors">
                      <FileText size={11} className="text-[#6b7280] flex-shrink-0"/>
                      <p className="text-[#9ab5a0] text-xs flex-1 truncate">{d.originalName}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0 font-medium ${d.status==='READY'?'text-coal-green border-coal-green/20':'text-yellow-400 border-yellow-500/20'}`}>{d.status}</span>
                    </div>
                  ))}
                </div>
              </ApiState>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
