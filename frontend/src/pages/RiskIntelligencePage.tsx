/**
 * Panel 14 — Risk Intelligence
 * Risk matrix, summary table by category, detail panel.
 */
import { useState } from 'react'
import { AlertTriangle, TrendingDown, TrendingUp, Minus, X, RefreshCw } from 'lucide-react'
import { useReducedMotion } from '@/hooks'
import { ScrollReveal } from '@/components/common/ScrollReveal'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { KpiCardSkeleton } from '@/components/common/Skeleton'
import { ApiState } from '@/components/common/ApiState'
import { useFetch } from '@/hooks/useFetch'
import { riskApi, type RiskItem } from '@/services/api'

type RiskLevel = 'low'|'medium'|'high'|'critical'

const LEVEL_BADGE: Record<RiskLevel,string> = {
  critical:'bg-red-500/15 text-red-400 border-red-500/20',
  high:'bg-orange-500/12 text-orange-400 border-orange-500/18',
  medium:'bg-yellow-500/10 text-yellow-400 border-yellow-500/15',
  low:'bg-coal-green/10 text-coal-green border-coal-green/15',
}
const MATRIX_CLR: Record<RiskLevel,string> = {
  critical:'bg-red-500/25 border-red-500/30',
  high:'bg-orange-500/18 border-orange-500/25',
  medium:'bg-yellow-500/15 border-yellow-500/20',
  low:'bg-coal-green/8 border-coal-green/15',
}
function matrixLevel(sev:number,lik:number):RiskLevel {
  const s=sev*lik
  return s>=16?'critical':s>=9?'high':s>=4?'medium':'low'
}

export function RiskIntelligencePage() {
  const reduced = useReducedMotion()
  const [selected, setSelected] = useState<RiskItem|null>(null)
  const summaryQ = useFetch(()=>riskApi.summary())
  const risksQ   = useFetch(()=>riskApi.list())
  const summary  = summaryQ.data
  const RISKS: RiskItem[] = risksQ.data?.risks||[]
  const TI = (t:string)=>t==='up'?TrendingUp:t==='down'?TrendingDown:Minus

  // Category breakdown
  const cats = ['Geological','Machinery','Environmental','Operational','Safety']
  const byCat = cats.map(c=>({
    cat:c,
    critical: RISKS.filter(r=>r.category===c&&r.level==='critical').length,
    high:     RISKS.filter(r=>r.category===c&&r.level==='high').length,
    medium:   RISKS.filter(r=>r.category===c&&r.level==='medium').length,
    low:      RISKS.filter(r=>r.category===c&&r.level==='low').length,
    total:    RISKS.filter(r=>r.category===c).length,
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ScrollReveal className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-coal-green text-xs font-semibold tracking-widest uppercase mb-1">Risk Intelligence</p>
            <h1 className="text-white text-2xl font-bold">Risk Register</h1>
            <p className="text-[#6b7280] text-sm mt-1">AI-synthesised risk landscape across all operational areas.</p>
          </div>
          <button onClick={()=>{summaryQ.refetch();risksQ.refetch()}} className="btn-ghost text-xs gap-1.5"><RefreshCw size={12}/>Refresh</button>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryQ.loading?Array.from({length:4}).map((_,i)=><KpiCardSkeleton key={i} delay={i*80}/>):<>
          <KpiCard label="Total Risks" value={summary?.total||0}    delay={0}/>
          <KpiCard label="Critical"    value={summary?.critical||0} trend="flat" delay={80}/>
          <KpiCard label="High"        value={summary?.high||0}     trend="up"   delay={160}/>
          <KpiCard label="Avg. Score"  value={summary?.avgScore||0} decimals={1} trend="down" delay={240}/>
        </>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">

          {/* Risk Matrix */}
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] p-5" style={{background:'#0e1f16'}}>
              <p className="text-white text-sm font-semibold mb-3">Risk Matrix</p>
              <div className="overflow-x-auto">
                <div className="min-w-[320px]">
                  <div className="flex">
                    <div className="w-20 flex-shrink-0"/>
                    <div className="flex-1 text-center text-[#6b7280] text-xs mb-1 uppercase tracking-widest">Consequence →</div>
                  </div>
                  {[5,4,3,2,1].map(lik=>(
                    <div key={lik} className="flex items-center gap-1 mb-1">
                      <div className="w-20 flex-shrink-0 text-right pr-3 text-[#6b7280] text-xs">{lik===3?'← Likelihood':''}</div>
                      {[1,2,3,4,5].map(sev=>{
                        const level=matrixLevel(sev,lik)
                        const here=RISKS.filter(r=>r.severity===sev&&r.likelihood===lik)
                        const isSel=here.some(r=>r.id===selected?.id)
                        return (
                          <div key={sev}
                            className={`risk-cell flex-1 aspect-square rounded-md border flex flex-col items-center justify-center gap-0.5 min-w-[38px] ${MATRIX_CLR[level]} ${isSel?'selected':''}`}
                            onClick={()=>here.length>0&&setSelected(here[0])}
                            role={here.length>0?'button':undefined}
                            tabIndex={here.length>0?0:undefined}
                            onKeyDown={e=>{if(e.key==='Enter'&&here.length>0)setSelected(here[0])}}>
                            {here.map(r=>(
                              <div key={r.id} className={`w-2 h-2 rounded-full ${r.level==='critical'&&!reduced?'animate-status-pulse':''} ${r.level==='critical'?'bg-red-400':r.level==='high'?'bg-orange-400':r.level==='medium'?'bg-yellow-400':'bg-coal-green'}`}/>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Risk Summary by Category */}
          <ScrollReveal delay={60}>
            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
              <p className="text-white text-sm font-semibold px-5 py-3.5 border-b border-[#1c3828]">Risk Summary by Category</p>
              <table className="w-full text-xs">
                <thead><tr className="border-b border-[#1c3828]">
                  {['Category','Critical','High','Medium','Low','Total'].map(h=>(
                    <th key={h} className="text-left px-4 py-2.5 text-[#6b7280] text-[10px] font-semibold uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {byCat.map(c=>(
                    <tr key={c.cat} className="border-b border-[#1c3828]/40 last:border-0 hover:bg-coal-green/[0.03] transition-colors">
                      <td className="px-4 py-2.5 text-white font-medium">{c.cat}</td>
                      <td className="px-4 py-2.5 text-red-400 font-bold">{c.critical||'—'}</td>
                      <td className="px-4 py-2.5 text-orange-400 font-bold">{c.high||'—'}</td>
                      <td className="px-4 py-2.5 text-yellow-400">{c.medium||'—'}</td>
                      <td className="px-4 py-2.5 text-coal-green">{c.low||'—'}</td>
                      <td className="px-4 py-2.5 text-[#9ab5a0] font-semibold">{c.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>

          {/* Risk Table */}
          <ScrollReveal distance={16}>
            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
              <ApiState loading={risksQ.loading} error={risksQ.error} empty={RISKS.length===0}
                emptyMsg="No risk data. Ensure the backend is running and the database is seeded." onRetry={risksQ.refetch}>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-[#1c3828]">
                    {['Risk','Category','Level','Trend','Owner'].map(h=>(
                      <th key={h} className="text-left px-4 py-2.5 text-[#6b7280] text-[10px] font-semibold uppercase tracking-wide">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {RISKS.map(risk=>{
                      const T=TI(risk.trend); const isSel=risk.id===selected?.id
                      return (
                        <tr key={risk.id}
                          className={`border-b border-[#1c3828]/40 last:border-0 table-row-interactive transition-colors duration-150 ${isSel?'bg-coal-green/[0.04]':''}`}
                          onClick={()=>setSelected(isSel?null:risk)}>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              {risk.level==='critical'&&<AlertTriangle size={11} className={`text-red-400 ${reduced?'':'animate-status-pulse'}`}/>}
                              <span className="text-white text-xs font-medium">{risk.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-[#9ab5a0]">{risk.category}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium capitalize ${LEVEL_BADGE[risk.level as RiskLevel]||''}`}>{risk.level}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <T size={12} className={risk.trend==='up'?'text-red-400':risk.trend==='down'?'text-coal-green':'text-[#6b7280]'}/>
                          </td>
                          <td className="px-4 py-2.5 text-[#9ab5a0]">{risk.owner||'—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </ApiState>
            </div>
          </ScrollReveal>
        </div>

        {/* Detail panel */}
        <div className="xl:col-span-1">
          {selected ? (
            <div key={selected.id} className={`sticky top-6 rounded-xl border border-[#1c3828] overflow-hidden ${reduced?'':'animate-slide-in-right'}`} style={{background:'#0e1f16'}}>
              <div className={`flex items-start justify-between p-4 border-b border-[#1c3828] ${LEVEL_BADGE[selected.level as RiskLevel]}`}>
                <div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize font-medium mb-1.5 inline-block ${LEVEL_BADGE[selected.level as RiskLevel]}`}>{selected.level}</span>
                  <h3 className="text-white font-semibold text-sm leading-snug">{selected.title}</h3>
                  <p className="text-[#6b7280] text-xs mt-0.5">{selected.category}</p>
                </div>
                <button onClick={()=>setSelected(null)} className="text-[#6b7280] hover:text-white transition-colors p-1"><X size={13}/></button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {[['Severity',`${selected.severity}/5`],['Likelihood',`${selected.likelihood}/5`],['Risk Score',selected.severity*selected.likelihood],['Owner',selected.owner||'—']].map(([l,v])=>(
                    <div key={l as string} className="bg-[#122318] rounded-lg px-3 py-2">
                      <p className="text-[#6b7280] text-[10px] mb-0.5">{l}</p>
                      <p className="text-white text-xs font-semibold">{v}</p>
                    </div>
                  ))}
                </div>
                {selected.description&&(
                  <div>
                    <p className="text-[#6b7280] text-[10px] font-semibold uppercase tracking-widest mb-1.5">Description</p>
                    <p className="text-[#9ab5a0] text-xs leading-relaxed">{selected.description}</p>
                  </div>
                )}
                {Array.isArray(selected.controls)&&selected.controls.length>0&&(
                  <div>
                    <p className="text-[#6b7280] text-[10px] font-semibold uppercase tracking-widest mb-1.5">Controls</p>
                    <ul className="space-y-1.5">
                      {selected.controls.map((c,i)=>(
                        <li key={i} className={`flex items-start gap-2 text-xs text-[#9ab5a0] ${reduced?'':'animate-fade-up'}`} style={{animationDelay:`${i*80}ms`,animationFillMode:'both'}}>
                          <span className="w-1 h-1 rounded-full bg-coal-green mt-1.5 flex-shrink-0"/>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selected.recommendedAction&&(
                  <div>
                    <p className="text-[#6b7280] text-[10px] font-semibold uppercase tracking-widest mb-1.5">Recommended Action</p>
                    <p className="text-[#9ab5a0] text-xs leading-relaxed">{selected.recommendedAction}</p>
                  </div>
                )}
              </div>
            </div>
          ):(
            <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-[#1c3828] text-center p-6" style={{background:'#0e1f16'}}>
              <AlertTriangle size={24} className="text-[#6b7280] mb-3"/>
              <p className="text-[#9ab5a0] text-sm">Select a risk to view details</p>
              <p className="text-[#6b7280] text-xs mt-1">Click any row or matrix cell</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
