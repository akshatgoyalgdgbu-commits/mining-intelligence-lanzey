/**
 * Panel 8 — Machinery Dashboard
 * Fleet KPIs, equipment risk status bars, top risk equipment table, AI risk labels.
 */
import { useState } from 'react'
import { Cpu, RefreshCw, Activity, Wrench, Gauge, Info, AlertTriangle, ShieldCheck } from 'lucide-react'
import { ScrollReveal } from '@/components/common/ScrollReveal'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { KpiCardSkeleton } from '@/components/common/Skeleton'
import { ApiState } from '@/components/common/ApiState'
import { DeptHeader } from '@/components/layout/DeptHeader'
import { useFetch } from '@/hooks/useFetch'
import { machineryApi, type Machine } from '@/services/api'
import { useNavigate } from 'react-router-dom'

function riskScore(m: Machine) {
  let s = 0
  if (m.status==='BREAKDOWN')  s+=40
  if (m.status==='MAINTENANCE') s+=20
  if (m.status==='IDLE')        s+=10
  const age = m.yearOfManufacture ? new Date().getFullYear()-m.yearOfManufacture : 0
  if (age>15) s+=25; else if (age>10) s+=15; else if (age>7) s+=8
  const h = m.hoursOperated||0
  if (h>12000) s+=20; else if (h>8000) s+=10
  if (!(m._count?.maintenance)) s+=15
  return Math.min(s,100)
}
function riskLevel(score:number):'critical'|'high'|'medium'|'low' {
  return score>=60?'critical':score>=40?'high':score>=20?'medium':'low'
}
const RISK_COLOR = { critical:'text-red-400 bg-red-500/10 border-red-500/20', high:'text-orange-400 bg-orange-500/10 border-orange-500/20', medium:'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', low:'text-coal-green bg-coal-green/10 border-coal-green/20' }
const RISK_BAR   = { critical:'bg-red-400', high:'bg-orange-400', medium:'bg-yellow-400', low:'bg-coal-green' }
const STATUS_CLR = { OPERATIONAL:'text-coal-green border-coal-green/20', BREAKDOWN:'text-red-400 border-red-500/20', MAINTENANCE:'text-yellow-400 border-yellow-500/20', IDLE:'text-[#6b7280] border-[#1c3828]' }

function MachineDetail({ machine }: { machine: Machine }) {
  const maintQ    = useFetch(() => machineryApi.maintenance(machine.id),[machine.id])
  const telQ      = useFetch(() => machineryApi.telemetry(machine.id,5),[machine.id])
  const latest    = telQ.data?.telemetry?.[0]
  const score     = riskScore(machine)
  const level     = riskLevel(score)
  return (
    <div className="space-y-4 animate-slide-in-right">
      <div className="rounded-xl border border-[#1c3828] p-5" style={{background:'#0e1f16'}}>
        <h3 className="text-white font-semibold text-sm mb-4">{machine.name}</h3>
        <div className="grid grid-cols-2 gap-3">
          {[['Asset ID',machine.machineId],['Type',machine.type],['Make',machine.make||'—'],['Year',machine.yearOfManufacture||'—'],['Hours',machine.hoursOperated?.toLocaleString()||'—'],['Site',machine.site?.name||'—']].map(([l,v])=>(
            <div key={l as string} className="bg-[#122318] rounded-lg px-3 py-2.5">
              <p className="text-[#6b7280] text-[10px] mb-0.5">{l}</p>
              <p className="text-white text-xs font-semibold">{v}</p>
            </div>
          ))}
        </div>
      </div>
      <div className={`border rounded-xl p-4 ${level==='critical'?'bg-red-500/5 border-red-500/25':level==='high'?'bg-orange-500/5 border-orange-500/25':level==='medium'?'bg-yellow-500/5 border-yellow-500/25':'bg-coal-green/5 border-coal-green/20'}`}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={13} className="text-orange-400"/>
          <p className="text-white text-xs font-semibold">AI Risk Assessment</p>
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[#122318] border border-[#1c3828] text-[#6b7280] flex items-center gap-0.5">
            <Info size={8}/> AI PREDICTION
          </span>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-sm font-bold px-3 py-1 rounded-lg border capitalize ${RISK_COLOR[level]}`}>{level} Risk</span>
          <span className="text-[#6b7280] text-xs">{score}/100</span>
        </div>
        <div className="h-1.5 bg-[#1c3828] rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${RISK_BAR[level]}`} style={{width:`${score}%`}}/>
        </div>
        <p className="text-[#6b7280] text-[9px] mt-2 italic">* AI prediction based on age, hours, status and maintenance history. Verify with physical inspection.</p>
      </div>
      {latest && (
        <div className="rounded-xl border border-[#1c3828] p-4" style={{background:'#0e1f16'}}>
          <div className="flex items-center gap-2 mb-3">
            <Gauge size={12} className="text-coal-green"/>
            <p className="text-white text-xs font-semibold">Live Telemetry</p>
            <span className="text-[#6b7280] text-[10px] ml-auto">{new Date(latest.recordedAt).toLocaleTimeString()}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[['Fuel',latest.fuelLevel?.toFixed(0)+'%'],['Temp',latest.engineTemp?.toFixed(0)+'°C'],['RPM',latest.rpm?.toFixed(0)],['Oil',latest.oilPressure?.toFixed(0)+'bar'],['Hrs',latest.hoursToday?.toFixed(1)],['Speed',latest.speed?.toFixed(0)+'km/h']].map(([l,v])=>(
              <div key={l as string} className="text-center py-2 bg-[#122318] rounded-lg">
                <p className="text-coal-green text-sm font-bold">{v||'—'}</p>
                <p className="text-[#6b7280] text-[10px]">{l}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1c3828]">
          <Wrench size={12} className="text-[#6b7280]"/>
          <p className="text-white text-xs font-semibold">Maintenance History</p>
        </div>
        <ApiState loading={maintQ.loading} error={maintQ.error} empty={!maintQ.data?.maintenance?.length} emptyMsg="No maintenance records.">
          <div className="divide-y divide-[#1c3828]/50">
            {maintQ.data?.maintenance?.slice(0,4).map(m=>(
              <div key={m.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-white text-xs font-medium capitalize">{m.type}</p>
                  <span className={`text-[10px] ${m.status==='COMPLETED'?'text-coal-green':'text-yellow-400'}`}>{m.status}</span>
                </div>
                <p className="text-[#6b7280] text-[11px] truncate">{m.description}</p>
                <p className="text-[#6b7280] text-[10px] mt-0.5">{new Date(m.startDate).toLocaleDateString()}{m.cost?` · ₹${m.cost.toLocaleString()}`:''}</p>
              </div>
            ))}
          </div>
        </ApiState>
      </div>
    </div>
  )
}

export function MachineryDashboard() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Machine|null>(null)
  const [statusF,  setStatusF]  = useState('')
  const summaryQ = useFetch(()=>machineryApi.summary())
  const listQ    = useFetch(()=>machineryApi.list(statusF?{status:statusF}:{}),[statusF])
  const summary  = summaryQ.data
  const machines = listQ.data?.machinery||[]
  const sorted   = [...machines].sort((a,b)=>riskScore(b)-riskScore(a))
  const critical = machines.filter(m=>riskLevel(riskScore(m))==='critical').length
  const high     = machines.filter(m=>riskLevel(riskScore(m))==='high').length
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DeptHeader icon={<Cpu size={20}/>} color="#7c4dff" dept="MACHINERY"
        title="Machinery Department Dashboard"
        subtitle="Fleet status, AI-powered risk assessment, telemetry and maintenance"
        actions={<button onClick={()=>navigate('/reports/generate?dept=machinery&type=machinery')}
          className="btn-primary text-xs py-2 px-4" style={{borderColor:'#7c4dff',color:'#7c4dff'}}>Generate Report</button>}/>
      {(critical+high)>0 && (
        <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20 animate-fade-in">
          <AlertTriangle size={15} className="text-red-400 flex-shrink-0"/>
          <p className="text-white text-xs font-semibold">{critical+high} machine{critical+high>1?'s':''} flagged by AI — verify with physical inspection</p>
          <span className="ml-auto text-[9px] px-2 py-0.5 rounded bg-[#122318] border border-[#1c3828] text-[#6b7280]">AI PREDICTION</span>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        {summaryQ.loading?Array.from({length:5}).map((_,i)=><KpiCardSkeleton key={i} delay={i*60}/>):<>
          <KpiCard label="Total Fleet"  value={summary?.total||0}         delay={0}/>
          <KpiCard label="Operational"  value={summary?.operational||0}   trend="up" delay={60}/>
          <KpiCard label="Maintenance"  value={summary?.maintenance||0}   delay={120}/>
          <KpiCard label="Breakdown"    value={summary?.breakdown||0}     trend={summary?.breakdown?'up':'flat'} delay={180}/>
          <KpiCard label="Utilisation"  value={summary?.utilizationPct||0} suffix="%" decimals={1} delay={240}/>
        </>}
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['','OPERATIONAL','MAINTENANCE','BREAKDOWN','IDLE'].map(s=>(
          <button key={s} onClick={()=>setStatusF(s)}
            className={`px-3 py-1 rounded-full text-xs border transition-all ${statusF===s?'border-[#7c4dff] text-[#7c4dff] bg-[#7c4dff]/10':'border-[#1c3828] text-[#9ab5a0] hover:border-[#7c4dff]/40'}`}>
            {s||'All'}
          </button>
        ))}
        <button onClick={listQ.refetch} className="btn-ghost text-xs gap-1 ml-auto"><RefreshCw size={11}/></button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-4">
          {/* Equipment Risk Status bars */}
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] p-5" style={{background:'#0e1f16'}}>
              <p className="text-white text-sm font-semibold mb-4">Equipment Risk Status <span className="text-[9px] text-[#6b7280] ml-2 font-normal">(AI Prediction)</span></p>
              <ApiState loading={listQ.loading} error={listQ.error} empty={machines.length===0} emptyMsg="No machines found.">
                <div className="space-y-2.5">
                  {sorted.slice(0,8).map(m=>{
                    const score = riskScore(m); const level = riskLevel(score)
                    return (
                      <div key={m.id} className="flex items-center gap-3 cursor-pointer group" onClick={()=>setSelected(m)}>
                        <p className="text-white text-xs w-36 truncate group-hover:text-coal-green transition-colors">{m.name}</p>
                        <div className="flex-1 bg-[#1c3828] rounded-full h-2 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${RISK_BAR[level]}`} style={{width:`${score}%`}}/>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium w-16 text-center capitalize flex-shrink-0 ${RISK_COLOR[level]}`}>{level}</span>
                        <span className="text-[#6b7280] text-xs w-8 text-right tabular-nums">{score}%</span>
                      </div>
                    )
                  })}
                </div>
              </ApiState>
            </div>
          </ScrollReveal>
          {/* Top risk table */}
          <ScrollReveal delay={60}>
            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
              <p className="text-white text-sm font-semibold px-5 py-3.5 border-b border-[#1c3828]">Top Risk Equipment</p>
              <table className="w-full text-xs">
                <thead><tr className="border-b border-[#1c3828]">
                  {['Equipment','Type','Status','Risk','Action'].map(h=>(
                    <th key={h} className="text-left px-4 py-2.5 text-[#6b7280] text-[10px] font-semibold uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {sorted.slice(0,6).map(m=>{
                    const score=riskScore(m); const level=riskLevel(score)
                    return (
                      <tr key={m.id} className="border-b border-[#1c3828]/40 last:border-0 hover:bg-coal-green/[0.03] transition-colors cursor-pointer" onClick={()=>setSelected(m)}>
                        <td className="px-4 py-2.5 text-white font-medium">{m.name}</td>
                        <td className="px-4 py-2.5 text-[#9ab5a0]">{m.type}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_CLR[m.status as keyof typeof STATUS_CLR]||''}`}>{m.status}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${RISK_COLOR[level]}`}>{level}</span>
                        </td>
                        <td className="px-4 py-2.5 text-[#7c4dff] text-xs cursor-pointer hover:underline" onClick={()=>setSelected(m)}>Inspect</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
        <div>
          {selected ? <MachineDetail machine={selected}/> : (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-[#1c3828] text-center p-6" style={{background:'#0e1f16'}}>
              <Activity size={28} className="text-[#6b7280] mb-3"/>
              <p className="text-[#9ab5a0] text-sm">Select a machine</p>
              <p className="text-[#6b7280] text-xs mt-1">View details and AI risk analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
