/**
 * Panel 7 — Environmental Dashboard
 * Mine-wise factor trends (SPM, SO2, pH, TDS), compliance donut,
 * monitoring table, OCR upload.
 */
import { useState } from 'react'
import { Leaf, RefreshCw, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'
import { ScrollReveal } from '@/components/common/ScrollReveal'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { KpiCardSkeleton } from '@/components/common/Skeleton'
import { ApiState } from '@/components/common/ApiState'
import { DeptHeader } from '@/components/layout/DeptHeader'
import { DocumentUploadWidget } from '@/components/common/DocumentUploadWidget'
import { useFetch } from '@/hooks/useFetch'
import { environmentApi, documentsApi, sitesApi, type EnvRecord } from '@/services/api'
import { useNavigate } from 'react-router-dom'
import { useReducedMotion } from '@/hooks'

function ComplianceDonut({ compliant, nonCompliant }: { compliant: number; nonCompliant: number }) {
  const total = compliant + nonCompliant || 1
  const R = 36, C = 2 * Math.PI * R
  const dash = (compliant / total) * C
  return (
    <div className="flex items-center gap-4">
      <svg width={92} height={92} viewBox="0 0 92 92">
        <circle cx={46} cy={46} r={R} fill="none" stroke="#1c3828" strokeWidth={12}/>
        <circle cx={46} cy={46} r={R} fill="none" stroke="#00c853" strokeWidth={12}
          strokeDasharray={`${dash} ${C-dash}`}
          style={{transform:'rotate(-90deg)',transformOrigin:'46px 46px'}}/>
        {nonCompliant>0&&(
          <circle cx={46} cy={46} r={R} fill="none" stroke="#f44336" strokeWidth={12}
            strokeDasharray={`${C-dash} ${dash}`} strokeDashoffset={-dash}
            style={{transform:'rotate(-90deg)',transformOrigin:'46px 46px'}}/>
        )}
        <text x={46} y={43} textAnchor="middle" className="fill-white text-[11px] font-black">{Math.round((compliant/total)*100)}%</text>
        <text x={46} y={55} textAnchor="middle" className="fill-[#6b7280] text-[8px]">Compliant</text>
      </svg>
      <div className="space-y-2">
        {[{label:'Compliant',value:compliant,color:'#00c853'},{label:'Non-Compliant',value:nonCompliant,color:'#f44336'}].map(d=>(
          <div key={d.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm" style={{background:d.color}}/>
            <span className="text-[#9ab5a0] text-xs">{d.label}</span>
            <span className="text-white text-xs font-bold ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const PARAMS = [
  { key:'SPM',  label:'SPM (µg/m³)',  color:'#f44336', standard:600  },
  { key:'SO2',  label:'SO₂ (µg/m³)',  color:'#ffb300', standard:80   },
  { key:'pH',   label:'pH',           color:'#29b6f6', standard:8.5  },
  { key:'TDS',  label:'TDS (mg/L)',   color:'#7c4dff', standard:2100 },
  { key:'Leq',  label:'Noise dB(A)', color:'#00acc1', standard:75   },
]

function FactorTrendBySite({
  records, paramKey, label, color, standard, reduced,
}: { records:EnvRecord[]; paramKey:string; label:string; color:string; standard:number; reduced:boolean }) {
  const bySite: Record<string,{name:string;values:number[];code:string}> = {}
  for (const r of records.filter(x=>x.parameter===paramKey)) {
    const key = r.site?.code || r.siteId || 'unknown'
    if (r.value == null) continue
    if (!bySite[key]) bySite[key] = { name:r.site?.name||key, code:key, values:[] }
    bySite[key].values.push(r.value)
  }
  const bars = Object.entries(bySite).map(([,v])=>({
    name:v.name, avg:v.values.reduce((s,x)=>s+x,0)/v.values.length
  })).sort((a,b)=>b.avg-a.avg).slice(0,6)

  if (!bars.length) return <p className="text-[#6b7280] text-xs py-2 text-center">No {paramKey} data available.</p>
  const max = Math.max(...bars.map(b=>b.avg), standard, 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[#9ab5a0] text-xs font-semibold">{label} — Mine-wise Average</p>
        <span className="text-[#6b7280] text-[10px]">Standard: {standard}</span>
      </div>
      <div className="space-y-2">
        {bars.map((b,i)=>{
          const pct=(b.avg/max)*100; const exceeds=b.avg>standard
          return (
            <div key={b.name} className="flex items-center gap-3">
              <span className="text-[#9ab5a0] text-[10px] w-28 truncate">{b.name}</span>
              <div className="flex-1 bg-[#1c3828] rounded-full h-2 overflow-hidden relative">
                {/* Standard line */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-white/20 z-10" style={{left:`${(standard/max)*100}%`}}/>
                <div className={`h-full rounded-full`}
                  style={{background:exceeds?'#f44336':color,width:`${pct}%`,transition:reduced?'none':`width 700ms ease-out ${i*60}ms`}}/>
              </div>
              <span className={`text-xs font-semibold tabular-nums w-16 text-right ${exceeds?'text-red-400':'text-white'}`}>
                {b.avg.toFixed(1)} {exceeds?'⚠':''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function EnvironmentalDashboard() {
  const navigate   = useNavigate()
  const reduced    = useReducedMotion()
  const [selectedSite, setSelectedSite] = useState('')
  const [typeFilter,   setTypeFilter]   = useState('')
  const [factorParam,  setFactorParam]  = useState('SPM')

  const summaryQ  = useFetch(() => environmentApi.complianceSummary(selectedSite?{siteId:selectedSite}:{}), [selectedSite])
  const recordsQ  = useFetch(() => environmentApi.list({
    ...(typeFilter?{paramType:typeFilter}:{}),
    ...(selectedSite?{siteId:selectedSite}:{}),
  }), [typeFilter, selectedSite])
  const docsQ     = useFetch(() => documentsApi.list({ department:'environment', limit:'5' }))
  const sitesQ    = useFetch(() => sitesApi.list())

  const summary   = summaryQ.data
  const records   = recordsQ.data?.records || []
  const sites     = sitesQ.data?.sites     || []
  const currentParam = PARAMS.find(p=>p.key===factorParam)!

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DeptHeader icon={<Leaf size={20}/>} color="#43a047" dept="ENVIRONMENT"
        title="Environmental Department Dashboard"
        subtitle="Mine-wise pollution factor trends, compliance monitoring, clearances"
        actions={<button onClick={()=>navigate('/reports/generate?dept=environment&type=environmental')}
          className="btn-primary text-xs py-2 px-4" style={{borderColor:'#43a047',color:'#43a047'}}>
          Generate Report</button>}/>

      {/* Site filter */}
      <ScrollReveal className="mb-5">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[#6b7280] text-xs">Mine Site:</span>
          <button onClick={()=>setSelectedSite('')}
            className={`px-3 py-1 rounded-full text-xs border transition-all ${!selectedSite?'border-[#43a047] text-[#43a047] bg-[#43a047]/10':'border-[#1c3828] text-[#9ab5a0]'}`}>
            All Mines
          </button>
          {sites.slice(0,8).map(s=>(
            <button key={s.id} onClick={()=>setSelectedSite(s.id)}
              className={`px-3 py-1 rounded-full text-xs border transition-all ${selectedSite===s.id?'border-[#43a047] text-[#43a047] bg-[#43a047]/10':'border-[#1c3828] text-[#9ab5a0] hover:border-[#43a047]/40'}`}>
              {s.code}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryQ.loading?Array.from({length:4}).map((_,i)=><KpiCardSkeleton key={i} delay={i*80}/>):<>
          <KpiCard label="Total Readings"  value={summary?.total||0}              delay={0}/>
          <KpiCard label="Compliant"       value={summary?.compliant||0}          trend="up" delay={80}/>
          <KpiCard label="Non-Compliant"   value={summary?.nonCompliant||0}       trend={summary?.nonCompliant?'up':'flat'} delay={160}/>
          <KpiCard label="Compliance Rate" value={summary?.complianceRate||0}     suffix="%" decimals={1} delay={240}/>
        </>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">

          {/* Factor trends — mine-wise */}
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] p-5" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#43a047]"/>
                  <p className="text-white text-sm font-semibold">Pollution Factor Trends — Mine-wise</p>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {PARAMS.map(p=>(
                    <button key={p.key} onClick={()=>setFactorParam(p.key)}
                      className={`px-2 py-0.5 rounded text-[10px] border transition-all ${factorParam===p.key?'text-white border-[#1c3828] bg-[#122318]':'text-[#6b7280] border-transparent hover:text-white'}`}>
                      {p.key}
                    </button>
                  ))}
                </div>
              </div>
              <ApiState loading={recordsQ.loading} error={recordsQ.error}
                empty={records.length===0} emptyMsg="No monitoring data. Upload environmental reports to see factor trends.">
                <FactorTrendBySite records={records} paramKey={currentParam.key}
                  label={currentParam.label} color={currentParam.color}
                  standard={currentParam.standard} reduced={reduced}/>
              </ApiState>
            </div>
          </ScrollReveal>

          {/* Monitoring data table */}
          <ScrollReveal delay={60}>
            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c3828]">
                <p className="text-white text-sm font-semibold">
                  {selectedSite ? `Monitoring — ${sites.find(s=>s.id===selectedSite)?.name}` : 'All Monitoring Data'}
                </p>
                <div className="flex gap-1.5">
                  {['','air','water','noise','land'].map(t=>(
                    <button key={t} onClick={()=>setTypeFilter(t)}
                      className={`px-2 py-0.5 rounded text-[10px] border capitalize transition-all ${typeFilter===t?'border-[#43a047] text-[#43a047] bg-[#43a047]/10':'border-[#1c3828] text-[#6b7280]'}`}>
                      {t||'All'}
                    </button>
                  ))}
                  <button onClick={recordsQ.refetch} className="btn-ghost text-xs p-1"><RefreshCw size={11}/></button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-[#1c3828]">
                    {['Mine','Date','Type','Parameter','Value','Standard','Status'].map(h=>(
                      <th key={h} className="text-left px-3 py-2.5 text-[#6b7280] text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    <ApiState loading={recordsQ.loading} error={recordsQ.error}
                      empty={records.length===0} emptyMsg="No monitoring records. Upload environmental reports.">
                      <>
                        {records.slice(0,8).map(r=>(
                          <tr key={r.id} className="border-b border-[#1c3828]/40 last:border-0 hover:bg-coal-green/[0.03] transition-colors">
                            <td className="px-3 py-2.5 text-white font-medium">{r.site?.code||'—'}</td>
                            <td className="px-3 py-2.5 text-[#9ab5a0] whitespace-nowrap">{new Date(r.monitoringDate).toLocaleDateString()}</td>
                            <td className="px-3 py-2.5 text-[#9ab5a0] capitalize">{r.paramType}</td>
                            <td className="px-3 py-2.5 text-[#9ab5a0]">{r.parameter}</td>
                            <td className={`px-3 py-2.5 font-semibold tabular-nums ${r.compliant===false?'text-red-400':'text-white'}`}>
                              {r.value?.toFixed(2)||'—'} {r.unit}
                            </td>
                            <td className="px-3 py-2.5 text-[#6b7280] tabular-nums">{r.standard||'—'}</td>
                            <td className="px-3 py-2.5">
                              {r.compliant===true  && <span className="flex items-center gap-1 text-coal-green text-[10px]"><CheckCircle2 size={10}/>OK</span>}
                              {r.compliant===false && <span className="flex items-center gap-1 text-red-400   text-[10px]"><AlertTriangle size={10}/>Exceeds</span>}
                              {r.compliant==null   && <span className="text-[#6b7280] text-[10px]">—</span>}
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

          <ScrollReveal delay={80}>
            <DocumentUploadWidget department="environment" onReady={()=>{recordsQ.refetch();docsQ.refetch()}}/>
          </ScrollReveal>
        </div>

        <div className="space-y-4">
          {/* Compliance donut */}
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] p-5" style={{background:'#0e1f16'}}>
              <p className="text-white text-sm font-semibold mb-4">Compliance Status</p>
              <ComplianceDonut compliant={summary?.compliant||0} nonCompliant={summary?.nonCompliant||0}/>
            </div>
          </ScrollReveal>

          {/* By type breakdown */}
          <ScrollReveal delay={60}>
            <div className="rounded-xl border border-[#1c3828] p-4" style={{background:'#0e1f16'}}>
              <p className="text-white text-sm font-semibold mb-3">By Parameter Type</p>
              {(summary?.byType||[]).map(t=>(
                <div key={t.paramType} className="flex items-center gap-2 mb-2">
                  <span className="text-[#9ab5a0] text-xs capitalize w-16">{t.paramType}</span>
                  <div className="flex-1 bg-[#1c3828] rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full bg-[#43a047]/70"
                      style={{width:`${((t._count.id)/(summary?.total||1))*100}%`}}/>
                  </div>
                  <span className="text-[#6b7280] text-xs w-5 text-right">{t._count.id}</span>
                </div>
              ))}
              {(!summary?.byType||summary.byType.length===0)&&<p className="text-[#6b7280] text-xs">No data.</p>}
            </div>
          </ScrollReveal>

          {/* Site-specific data */}
          {selectedSite && (
            <ScrollReveal>
              <div className="rounded-xl border border-[#43a047]/25 p-4" style={{background:'#0e1f16',borderColor:'rgba(67,160,71,0.25)'}}>
                <p className="text-[#43a047] text-xs font-semibold uppercase tracking-widest mb-3">
                  {sites.find(s=>s.id===selectedSite)?.name} Summary
                </p>
                <div className="space-y-2">
                  {[
                    ['Total Readings', String(summary?.total||0)],
                    ['Compliant',      String(summary?.compliant||0)],
                    ['Non-Compliant',  String(summary?.nonCompliant||0)],
                    ['Compliance %',   `${summary?.complianceRate||0}%`],
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
        </div>
      </div>
    </div>
  )
}
