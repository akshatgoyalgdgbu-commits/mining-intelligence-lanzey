/**
 * Panel 5 — CMPDI Dashboard
 * Geological Data, Exploration Reports, Reserve Estimations, Site Study table.
 */
import { useState } from 'react'
import { HardHat, RefreshCw, BarChart3, Eye, ChevronDown, ChevronUp, FileText, Mountain } from 'lucide-react'
import { ScrollReveal } from '@/components/common/ScrollReveal'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { KpiCardSkeleton } from '@/components/common/Skeleton'
import { ApiState } from '@/components/common/ApiState'
import { DeptHeader } from '@/components/layout/DeptHeader'
import { useFetch } from '@/hooks/useFetch'
import { geologyApi, reportsApi, sitesApi, type Seam } from '@/services/api'
import { Link, useNavigate } from 'react-router-dom'

const SUITABILITY_COLOR: Record<string,string> = {
  Excellent: 'text-coal-green', Good: 'text-[#29b6f6]', Moderate: 'text-yellow-400', Poor: 'text-red-400',
}
function seamSuitability(s: Seam) {
  const score = (s.thickness||0)*10 + (s.gcv&&s.gcv>4500?20:s.gcv&&s.gcv>3500?10:0) + (s.ashContent&&s.ashContent<25?20:s.ashContent&&s.ashContent<35?10:0)
  return score>=40?'Excellent':score>=25?'Good':score>=15?'Moderate':'Poor'
}

function SeamRow({ s }: { s: Seam }) {
  const [open,setOpen] = useState(false)
  const suit = seamSuitability(s)
  return (
    <div className="border-b border-[#1c3828]/50 last:border-0">
      <button onClick={()=>setOpen(v=>!v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-coal-green/[0.03] transition-colors text-left">
        <Mountain size={11} className="text-[#ffb300] flex-shrink-0"/>
        <span className="text-white text-xs font-medium flex-1">{s.seamName}</span>
        <span className="text-[#9ab5a0] text-xs hidden sm:block">{s.site?.code||'—'}</span>
        <span className="text-coal-green text-xs font-semibold tabular-nums w-14 text-right">{s.thickness?.toFixed(1)||'—'} m</span>
        <span className={`text-xs font-semibold w-16 text-right ${SUITABILITY_COLOR[suit]}`}>{suit}</span>
        {open?<ChevronUp size={11} className="text-[#6b7280]"/>:<ChevronDown size={11} className="text-[#6b7280]"/>}
      </button>
      {open && (
        <div className="px-4 pb-3 grid grid-cols-3 gap-2 bg-[#122318]/40">
          {[['Depth',s.depth?s.depth.toFixed(1)+' m':'—'],['GCV',s.gcv?s.gcv.toFixed(0)+' kcal/kg':'—'],
            ['Ash %',s.ashContent?s.ashContent.toFixed(1)+'%':'—'],['Grade',s.gradeDesignation||'—'],
            ['Source',s.sourceDoc||'—'],['Page',s.sourcePage?'p.'+s.sourcePage:'—']
          ].map(([l,v])=>(
            <div key={l as string} className="py-1.5">
              <p className="text-[#6b7280] text-[10px]">{l}</p>
              <p className="text-white text-xs font-medium">{v}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CMPDIDashboard() {
  const navigate = useNavigate()
  const [rFilter,setRFilter] = useState('geological')
  const summaryQ = useFetch(()=>geologyApi.summary())
  const seamsQ   = useFetch(()=>geologyApi.seams())
  const reportsQ = useFetch(()=>reportsApi.list({type:rFilter,limit:'15'}),[rFilter])
  const sitesQ   = useFetch(()=>sitesApi.list())
  const s=summaryQ.data, seams=seamsQ.data?.seams||[], reports=reportsQ.data?.reports||[], sites=sitesQ.data?.sites||[]
  const gradeMap:Record<string,number>={}; for(const x of seams) if(x.gradeDesignation) gradeMap[x.gradeDesignation]=(gradeMap[x.gradeDesignation]||0)+1
  const grades=Object.entries(gradeMap).sort((a,b)=>b[1]-a[1]).slice(0,8)
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DeptHeader icon={<HardHat size={20}/>} color="#ffb300" dept="CMPDI" title="CMPDI Dashboard"
        subtitle="Geological assessment, reserve estimation and technical report review"
        actions={<button onClick={()=>navigate('/reports/generate?dept=cmpdi&type=geological')}
          className="btn-primary text-xs py-2 px-4" style={{borderColor:'#ffb300',color:'#ffb300'}}>Generate Assessment</button>}/>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryQ.loading?Array.from({length:4}).map((_,i)=><KpiCardSkeleton key={i} delay={i*80}/>):<>
          <KpiCard label="Seams Mapped"   value={s?.totalSeams||0}    delay={0}/>
          <KpiCard label="Geo Blocks"     value={s?.totalBlocks||0}   delay={80}/>
          <KpiCard label="Sites Assessed" value={s?.sitesWithData||0} delay={160}/>
          <KpiCard label="Exploration Sites" value={sites.length}     delay={240}/>
        </>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c3828]">
                <p className="text-white text-sm font-semibold">Geological Seam Database</p>
                <button onClick={seamsQ.refetch} className="btn-ghost text-xs gap-1"><RefreshCw size={11}/></button>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1c3828]/50 bg-[#122318]/40">
                {['Seam','Site','Thickness','Suitability'].map(h=>(
                  <span key={h} className={`text-[#6b7280] text-[10px] font-semibold uppercase ${h==='Seam'?'flex-1':h==='Site'?'hidden sm:block':'w-14 text-right last:w-16'}`}>{h}</span>
                ))}
                <span className="w-4"/>
              </div>
              <ApiState loading={seamsQ.loading} error={seamsQ.error} empty={seams.length===0} emptyMsg="No seam data found." onRetry={seamsQ.refetch}>
                <div className="max-h-72 overflow-y-auto">{seams.map(s=><SeamRow key={s.id} s={s}/>)}</div>
              </ApiState>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <div className="rounded-xl border border-[#1c3828] p-5" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-white text-sm font-semibold">Coal Grade Distribution</p>
                <BarChart3 size={14} className="text-[#6b7280]"/>
              </div>
              {grades.length===0?<p className="text-[#6b7280] text-xs">No grade data.</p>:(
                <div className="space-y-2">
                  {grades.map(([g,c])=>(
                    <div key={g} className="flex items-center gap-3">
                      <span className="text-[#9ab5a0] text-xs font-mono w-8">{g}</span>
                      <div className="flex-1 bg-[#1c3828] rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full bg-[#ffb300]/70" style={{width:`${(c/seams.length)*100}%`}}/>
                      </div>
                      <span className="text-[#6b7280] text-xs w-4 tabular-nums">{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
        <div>
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1c3828]">
                <p className="text-white text-sm font-semibold">Technical Reports</p>
                <button onClick={reportsQ.refetch} className="btn-ghost text-xs"><RefreshCw size={11}/></button>
              </div>
              <div className="flex gap-1 px-3 py-2 border-b border-[#1c3828]/50 overflow-x-auto">
                {['geological','reserve','production'].map(t=>(
                  <button key={t} onClick={()=>setRFilter(t)}
                    className={`px-2 py-0.5 rounded text-[10px] border capitalize whitespace-nowrap transition-all ${rFilter===t?'border-[#ffb300] text-[#ffb300] bg-[#ffb300]/10':'border-[#1c3828] text-[#6b7280]'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <ApiState loading={reportsQ.loading} error={reportsQ.error} empty={reports.length===0} emptyMsg="No reports.">
                <div className="divide-y divide-[#1c3828]/50 max-h-96 overflow-y-auto">
                  {reports.map(r=>(
                    <div key={r.id} className="px-4 py-3 hover:bg-[#122318]/40 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-white text-xs font-medium leading-snug">{r.title}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0 capitalize font-medium ${r.status==='APPROVED'?'text-coal-green border-coal-green/20 bg-coal-green/10':'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'}`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-[#6b7280] text-[10px]">{r.site?.name||'All Sites'} · {new Date(r.createdAt).toLocaleDateString()}</p>
                      <Link to={`/reports/validate/${r.id}`} className="inline-flex items-center gap-1 text-[#ffb300] text-[10px] hover:underline mt-1.5">
                        <Eye size={10}/> Review
                      </Link>
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
