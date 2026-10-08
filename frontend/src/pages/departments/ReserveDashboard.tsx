/**
 * Panel 9 — Reserve Dashboard
 * Coal reserve data, reserve comparison bar chart, reserve details table.
 * Production in / out data.
 */
import { useState } from 'react'
import { Database, RefreshCw, TrendingUp, TrendingDown, BarChart3, Truck } from 'lucide-react'
import { ScrollReveal } from '@/components/common/ScrollReveal'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { KpiCardSkeleton } from '@/components/common/Skeleton'
import { ApiState } from '@/components/common/ApiState'
import { DeptHeader } from '@/components/layout/DeptHeader'
import { useFetch } from '@/hooks/useFetch'
import { productionApi, reserveApi, sitesApi, type TrendPoint } from '@/services/api'
import { useNavigate } from 'react-router-dom'
import { useReducedMotion } from '@/hooks'

function ReserveBar({ data, reduced }: { data:{name:string;total:number;mineable:number}[]; reduced:boolean }) {
  const max = Math.max(...data.map(d=>d.total),1)
  return (
    <div className="space-y-3">
      {data.map((d,i)=>(
        <div key={d.name}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-white text-xs font-medium truncate">{d.name}</span>
            <span className="text-[#29b6f6] text-xs font-bold tabular-nums ml-2">{d.total.toFixed(0)} MT</span>
          </div>
          <div className="flex gap-1 h-3">
            <div className="flex-1 bg-[#1c3828] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#29b6f6]/70"
                style={{width:`${(d.total/max)*100}%`,transition:reduced?'none':`width 700ms ease-out ${i*60}ms`}}/>
            </div>
          </div>
          {d.mineable>0 && (
            <p className="text-[#6b7280] text-[10px] mt-0.5">Mineable: {d.mineable.toFixed(0)} MT</p>
          )}
        </div>
      ))}
    </div>
  )
}

export function ReserveDashboard() {
  const navigate  = useNavigate()
  const reduced   = useReducedMotion()
  const [site, setSite] = useState('')
  const [years, setYears] = useState('5')

  const summaryQ  = useFetch(()=>productionApi.summary(site?{siteId:site}:{}),[site])
  const trendQ    = useFetch(()=>productionApi.trend({years,...(site?{siteId:site}:{})}),[site,years])
  const reserveQ  = useFetch(()=>reserveApi.list(site?{siteId:site}:{}),[site])
  const rSummaryQ = useFetch(()=>reserveApi.summary(site?{siteId:site}:{}),[site])
  const sitesQ    = useFetch(()=>sitesApi.list())

  const summary  = summaryQ.data
  const trend    = trendQ.data?.trend||[]
  const reserves = reserveQ.data?.records||[]
  const rSummary = rSummaryQ.data
  const sites    = sitesQ.data?.sites||[]

  const reserveChartData = reserves.slice(0,6).map(r=>({
    name: r.site?.name||r.blockName||'Unknown',
    total: r.totalReserveMT||0,
    mineable: r.mineableReserveMT||0,
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DeptHeader icon={<Database size={20}/>} color="#29b6f6" dept="RESERVE"
        title="Reserve Department Dashboard"
        subtitle="Coal production data — extraction volumes, dispatch and reserve verification"
        actions={<button onClick={()=>navigate('/reports/generate?dept=reserve&type=production')}
          className="btn-primary text-xs py-2 px-4" style={{borderColor:'#29b6f6',color:'#29b6f6'}}>
          Production Report</button>}/>

      {/* Filters */}
      <ScrollReveal className="mb-5">
        <div className="flex flex-wrap gap-3 items-center">
          <select value={site} onChange={e=>setSite(e.target.value)}
            className="bg-[#122318] border border-[#1c3828] rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none">
            <option value="">All Mines</option>
            {sites.map(s=><option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
          {['3','5','7'].map(y=>(
            <button key={y} onClick={()=>setYears(y)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-all ${years===y?'border-[#29b6f6] text-[#29b6f6] bg-[#29b6f6]/10':'border-[#1c3828] text-[#9ab5a0]'}`}>
              {y}Y
            </button>
          ))}
          <button onClick={()=>{summaryQ.refetch();trendQ.refetch();reserveQ.refetch()}} className="btn-ghost text-xs gap-1 ml-auto"><RefreshCw size={11}/></button>
        </div>
      </ScrollReveal>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryQ.loading?Array.from({length:4}).map((_,i)=><KpiCardSkeleton key={i} delay={i*80}/>):<>
          <KpiCard label="Production (MT)"   value={summary?.totalProductionMT||0} decimals={1} delay={0}/>
          <KpiCard label="Target (MT)"       value={summary?.totalTargetMT||0}     decimals={1} delay={80}/>
          <KpiCard label="Achievement"       value={parseFloat(summary?.achievementPct||'0')} decimals={1} suffix="%" trend={parseFloat(summary?.achievementPct||'0')>=100?'up':'down'} delay={160}/>
          <KpiCard label="Total Reserve (MT)" value={typeof rSummary?.totalReserveMT==='number'?rSummary.totalReserveMT:0} decimals={0} delay={240}/>
        </>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          {/* Production trend */}
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] p-5" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white text-sm font-semibold">Production Trend (MT)</p>
                  <div className="flex gap-3 mt-1">
                    {[{color:'#29b6f6',label:'Actual'},{color:'#1c3828',label:'Target'}].map(l=>(
                      <div key={l.label} className="flex items-center gap-1.5">
                        <div className="w-3 h-2 rounded-sm" style={{background:l.color}}/>
                        <span className="text-[#6b7280] text-[10px]">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <TrendingUp size={15} className="text-[#29b6f6]"/>
              </div>
              <ApiState loading={trendQ.loading} error={trendQ.error} empty={trend.length===0} emptyMsg="No production data.">
                <div className="flex items-end gap-2 h-32">
                  {trend.map((t,i)=>{
                    const max=Math.max(...trend.map(x=>Math.max(x.productionMT,x.targetMT||0)),1)
                    const ach=t.targetMT>0?(t.productionMT/t.targetMT)*100:null
                    return (
                      <div key={t.year} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[#9ab5a0] text-[10px] font-semibold">{t.productionMT.toFixed(0)}</span>
                        <div className="w-full flex gap-0.5 items-end h-full">
                          {t.targetMT>0 && <div className="w-2/5 rounded-t-sm bg-[#1c3828]"
                            style={{height:`${Math.max((t.targetMT/max)*100,3)}%`,transition:reduced?'none':`height 700ms ease-out ${i*80}ms`}}/>}
                          <div className="flex-1 rounded-t-sm"
                            style={{background:ach&&ach>=100?'#29b6f6':'#29b6f6aa',height:`${Math.max((t.productionMT/max)*100,3)}%`,transition:reduced?'none':`height 700ms ease-out ${i*80}ms`}}/>
                        </div>
                        <span className="text-[#6b7280] text-[10px]">{t.year}</span>
                      </div>
                    )
                  })}
                </div>
              </ApiState>
            </div>
          </ScrollReveal>

          {/* Reserve details table */}
          <ScrollReveal delay={80}>
            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c3828]">
                <p className="text-white text-sm font-semibold">Reserve Details</p>
                <button onClick={reserveQ.refetch} className="btn-ghost text-xs"><RefreshCw size={11}/></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-[#1c3828]">
                    {['Mine','Block','Category','Reserve (MT)','Mineable (MT)','Grade','Status'].map(h=>(
                      <th key={h} className="text-left px-4 py-2.5 text-[#6b7280] text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    <ApiState loading={reserveQ.loading} error={reserveQ.error} empty={reserves.length===0} emptyMsg="No reserve records.">
                      <>
                        {reserves.map(r=>(
                          <tr key={r.id} className="border-b border-[#1c3828]/40 last:border-0 hover:bg-coal-green/[0.03] transition-colors">
                            <td className="px-4 py-2.5 text-white font-medium">{r.site?.name||'—'}</td>
                            <td className="px-4 py-2.5 text-[#9ab5a0]">{r.blockName||'—'}</td>
                            <td className="px-4 py-2.5 text-[#9ab5a0] capitalize">{r.category||'—'}</td>
                            <td className="px-4 py-2.5 text-white font-bold tabular-nums">
                              {r.totalReserveMT!=null?r.totalReserveMT.toLocaleString():<span className="text-[#6b7280] font-normal text-[10px]">Insufficient data</span>}
                            </td>
                            <td className="px-4 py-2.5 text-[#9ab5a0] tabular-nums">
                              {r.mineableReserveMT!=null?r.mineableReserveMT.toLocaleString():'—'}
                            </td>
                            <td className="px-4 py-2.5 text-[#ffb300] font-semibold">{r.gradeDesignation||'—'}</td>
                            <td className="px-4 py-2.5">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                                r.verificationStatus==='verified'?'text-coal-green border-coal-green/20':
                                r.verificationStatus==='pending'?'text-yellow-400 border-yellow-500/20':
                                'text-[#6b7280] border-[#1c3828]'}`}>
                                {r.verificationStatus?.replace('_',' ')||'—'}
                              </span>
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
        </div>

        {/* Reserve comparison chart */}
        <div>
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] p-5 mb-4" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-white text-sm font-semibold">Reserve Comparison (MT)</p>
                <BarChart3 size={13} className="text-[#29b6f6]"/>
              </div>
              <ApiState loading={reserveQ.loading} error={reserveQ.error} empty={reserveChartData.length===0} emptyMsg="No reserve data.">
                <ReserveBar data={reserveChartData} reduced={reduced}/>
              </ApiState>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <div className="rounded-xl border border-[#1c3828] p-4" style={{background:'#0e1f16'}}>
              <p className="text-white text-sm font-semibold mb-3">Year-wise Production</p>
              <ApiState loading={trendQ.loading} error={trendQ.error} empty={trend.length===0} emptyMsg="No data.">
                <div className="divide-y divide-[#1c3828]/50">
                  {[...trend].reverse().map(t=>{
                    const ach=t.targetMT>0?(t.productionMT/t.targetMT)*100:null
                    return (
                      <div key={t.year} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-white text-xs font-bold">{t.year}</p>
                          {t.targetMT>0 && <p className="text-[#6b7280] text-[10px]">Target: {t.targetMT.toFixed(1)} MT</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-[#29b6f6] text-xs font-bold tabular-nums">{t.productionMT.toFixed(1)} MT</p>
                          {ach!==null && (
                            <div className={`flex items-center gap-0.5 justify-end text-[10px] font-medium ${ach>=100?'text-coal-green':'text-yellow-400'}`}>
                              {ach>=100?<TrendingUp size={9}/>:<TrendingDown size={9}/>} {ach.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ApiState>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
