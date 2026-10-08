/**
 * Panel 11 — Document Processing
 * Drag & drop upload, real pipeline stages, uploaded docs table.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Cpu, Layers, Brain, Database, CheckCircle2, Loader2, FileText, RefreshCw, Trash2, Eye, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import { useReducedMotion } from '@/hooks'
import { ScrollReveal } from '@/components/common/ScrollReveal'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { KpiCardSkeleton } from '@/components/common/Skeleton'
import { ApiState } from '@/components/common/ApiState'
import { useFetch } from '@/hooks/useFetch'
import { documentsApi, knowledgeApi, type Document } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

const STAGES = [
  { status:'UPLOADED',    icon:Upload,       label:'Uploaded',    desc:'Document received and queued' },
  { status:'EXTRACTING',  icon:Cpu,          label:'OCR Extract', desc:'Extracting text from document' },
  { status:'PROCESSING',  icon:Layers,       label:'Processing',  desc:'Cleaning and chunking text' },
  { status:'AI_ANALYSIS', icon:Brain,        label:'AI Analysis', desc:'Identifying structured fields' },
  { status:'INDEXED',     icon:Database,     label:'Indexed',     desc:'Fields stored in knowledge base' },
  { status:'READY',       icon:CheckCircle2, label:'Ready',       desc:'Available for queries and reports' },
]
const ORDER = STAGES.map(s=>s.status)
function stageSt(docStatus:string, stageKey:string):'complete'|'active'|'waiting' {
  const di=ORDER.indexOf(docStatus), si=ORDER.indexOf(stageKey)
  return si<di?'complete':si===di?'active':'waiting'
}

function StageRow({stage,status,progress,reduced}:{stage:typeof STAGES[0];status:'complete'|'active'|'waiting';progress:number;reduced:boolean}) {
  const Icon=stage.icon
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${status==='active'?'bg-coal-green/5 border-coal-green/30 stage-active':status==='complete'?'bg-[#122318]/50 border-[#1c3828]':'bg-[#122318]/20 border-[#1c3828]/50 opacity-40'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${status==='complete'?'bg-coal-green/20 border border-coal-green/40':status==='active'?'bg-coal-green/10 border border-coal-green/30':'bg-[#122318] border border-[#1c3828]'}`}>
        {status==='active'&&!reduced?<Loader2 size={14} className="text-coal-green animate-spin"/>:status==='complete'?<CheckCircle2 size={14} className={`text-coal-green ${reduced?'':'animate-check-appear'}`}/>:<Icon size={14} className="text-[#6b7280]"/>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs font-semibold ${status!=='waiting'?'text-white':'text-[#6b7280]'}`}>{stage.label}</p>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${status==='complete'?'bg-coal-green/15 text-coal-green':status==='active'?'bg-coal-green/10 text-coal-green':'bg-[#122318] text-[#6b7280]'}`}>
            {status==='complete'?'✓ Done':status==='active'?'Active':'Waiting'}
          </span>
        </div>
        <p className="text-[#6b7280] text-[10px]">{stage.desc}</p>
        {status==='active'&&<>
          <div className="progress-bar mt-1.5"><div className={`progress-bar-fill ${reduced?'':'animate-progress-pulse'}`} style={{width:`${progress}%`}}/></div>
          <p className="text-coal-green text-[10px] mt-0.5 tabular-nums">{progress}%</p>
        </>}
      </div>
    </div>
  )
}

function UploadZone({onUploaded,dept}:{onUploaded:(d:Document)=>void;dept:string}) {
  const [dragging,setDragging]=useState(false)
  const [uploading,setUploading]=useState(false)
  const [error,setError]=useState('')
  const ref=useRef<HTMLInputElement>(null)
  async function handle(file:File) {
    setUploading(true); setError('')
    try { const {document:doc}=await documentsApi.upload(file,dept); onUploaded(doc) }
    catch(e:unknown){ setError(e instanceof Error?e.message:'Upload failed') }
    finally { setUploading(false); if(ref.current) ref.current.value='' }
  }
  return (
    <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)}
      onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f)handle(f)}}
      onClick={()=>!uploading&&ref.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${dragging?'border-coal-green bg-coal-green/5':'border-[#1c3828] hover:border-coal-green/40 hover:bg-[#122318]/40'} ${uploading?'opacity-60 cursor-wait':''}`}>
      <input ref={ref} type="file" className="hidden" disabled={uploading}
        accept=".pdf,.jpg,.jpeg,.png,.tiff,.xlsx,.xls,.doc,.docx,.txt"
        onChange={e=>{const f=e.target.files?.[0];if(f)handle(f)}}/>
      <div className="flex flex-col items-center gap-3">
        {uploading?<Loader2 size={28} className="text-coal-green animate-spin"/>:<Upload size={28} className={dragging?'text-coal-green':'text-[#6b7280]'}/>}
        <div>
          <p className="text-white text-sm font-semibold">{uploading?'Uploading...':dragging?'Drop to upload':'Drag & drop files here'}</p>
          <p className="text-[#6b7280] text-xs mt-1">Support: PDF, DOCX, XLSX, JPG, PNG, TIFF (up to 50 MB)</p>
        </div>
        {error&&<div className="flex items-center gap-1.5 text-red-400 text-xs"><AlertCircle size={12}/>{error}</div>}
      </div>
    </div>
  )
}

function ActiveDoc({doc,onDone}:{doc:Document;onDone:()=>void}) {
  const reduced=useReducedMotion()
  const [cur,setCur]=useState(doc.status)
  const [pct,setPct]=useState(doc.processingProgress||0)
  const [fields,setFields]=useState<{fieldName:string;fieldValue:string}[]>([])
  const pollRef=useRef<ReturnType<typeof setInterval>|null>(null)
  const calledRef=useRef(false)
  useEffect(()=>{
    if(cur==='READY'){ knowledgeApi.forDocument(doc.id).then(r=>setFields(r.entries||[])).catch(()=>{})
      if(!calledRef.current){calledRef.current=true;onDone()} }
  },[cur,doc.id,onDone])
  useEffect(()=>{
    if(cur==='READY'||cur==='ERROR'){if(pollRef.current)clearInterval(pollRef.current);return}
    pollRef.current=setInterval(async()=>{
      try{const s=await documentsApi.status(doc.id);setCur(s.status);setPct(s.processingProgress||0)}catch{}
    },3000)
    return()=>{if(pollRef.current)clearInterval(pollRef.current)}
  },[cur,doc.id])
  return (
    <div className="rounded-xl border border-[#1c3828] overflow-hidden animate-fade-up" style={{background:'#0e1f16'}}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c3828]">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={13} className="text-coal-green flex-shrink-0"/>
          <p className="text-white text-xs font-semibold truncate">{doc.originalName}</p>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${cur==='READY'?'bg-coal-green/10 text-coal-green border-coal-green/20':cur==='ERROR'?'bg-red-500/10 text-red-400 border-red-500/20':'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>{cur}</span>
      </div>
      <div className="p-3 space-y-2">
        {STAGES.map(s=><StageRow key={s.status} stage={s} status={stageSt(cur,s.status)} progress={cur===s.status?pct:0} reduced={reduced}/>)}
      </div>
      {cur==='READY'&&fields.length>0&&(
        <div className="px-4 pb-4 animate-fade-up">
          <p className="text-coal-green text-[10px] font-semibold uppercase tracking-widest mb-2">{fields.length} Fields Extracted</p>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {fields.slice(0,8).map(f=>(
              <div key={f.fieldName} className="bg-[#122318] rounded-lg px-2.5 py-2">
                <p className="text-[#6b7280] text-[9px] capitalize mb-0.5">{f.fieldName.replace(/([A-Z])/g,' $1').trim()}</p>
                <p className="text-white text-[10px] font-semibold truncate">{f.fieldValue.length>28?f.fieldValue.slice(0,26)+'…':f.fieldValue}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Link to="/ask" className="btn-ghost text-[10px] py-1 px-2.5 gap-1"><Brain size={10}/> Ask LANZEY</Link>
            <Link to="/knowledge" className="btn-ghost text-[10px] py-1 px-2.5 gap-1"><Database size={10}/> Knowledge Base</Link>
            <Link to={`/hitl/${doc.id}`} className="btn-ghost text-[10px] py-1 px-2.5 gap-1"><ShieldCheck size={10}/> HITL Verify</Link>
            <Link to="/reports/generate" className="btn-primary text-[10px] py-1 px-2.5 gap-1 ml-auto">Generate Report <ArrowRight size={10}/></Link>
          </div>
        </div>
      )}
    </div>
  )
}

export function DocumentProcessingPage() {
  const { user } = useAuth()
  const dept=user?.department||''
  const [activeDocs,setActiveDocs]=useState<Document[]>([])
  const [refreshKey,setRefreshKey]=useState(0)
  const docsQ=useFetch(()=>documentsApi.list({limit:'30'}),[refreshKey])
  const kbQ  =useFetch(()=>knowledgeApi.summary(dept?{department:dept}:{}),[refreshKey,dept])
  const docs  =docsQ.data?.documents||[]
  const kbData=kbQ.data
  function onUploaded(doc:Document){setActiveDocs(prev=>[doc,...prev.filter(d=>d.id!==doc.id)])}
  const onDone=useCallback(()=>setRefreshKey(k=>k+1),[])
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ScrollReveal className="mb-6">
        <p className="text-coal-green text-xs font-semibold tracking-widest uppercase mb-1">Document Processing</p>
        <h1 className="text-white text-2xl font-bold">OCR & AI Extraction Pipeline</h1>
        <p className="text-[#6b7280] text-sm mt-1">Upload documents → OCR extracts text → AI identifies fields → Knowledge base → Ready for queries and reports.</p>
      </ScrollReveal>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {docsQ.loading?Array.from({length:4}).map((_,i)=><KpiCardSkeleton key={i} delay={i*80}/>):<>
          <KpiCard label="Total Docs"  value={docsQ.data?.total||0} delay={0}/>
          <KpiCard label="Ready"       value={docs.filter(d=>d.status==='READY').length} delay={80}/>
          <KpiCard label="Processing"  value={docs.filter(d=>!['READY','ERROR'].includes(d.status)).length} delay={160}/>
          <KpiCard label="KB Fields"   value={kbData?.total||0} delay={240}/>
        </>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <ScrollReveal>
            <p className="text-white text-sm font-semibold mb-2">Upload Document</p>
            <UploadZone onUploaded={onUploaded} dept={dept}/>
          </ScrollReveal>
          {activeDocs.map(d=><ActiveDoc key={d.id} doc={d} onDone={onDone}/>)}
        </div>
        <div>
          <ScrollReveal>
            <div className="rounded-xl border border-[#1c3828] overflow-hidden" style={{background:'#0e1f16'}}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c3828]">
                <p className="text-white text-sm font-semibold">Uploaded Documents</p>
                <button onClick={()=>setRefreshKey(k=>k+1)} className="btn-ghost text-xs"><RefreshCw size={11}/></button>
              </div>
              {docs.length>0&&(
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-[#1c3828]">
                    {['File Name','Type','Size','Status','Actions'].map(h=>(
                      <th key={h} className="text-left px-4 py-2 text-[#6b7280] text-[10px] font-semibold uppercase tracking-wide">{h}</th>
                    ))}
                  </tr></thead>
                </table>
              )}
              <ApiState loading={docsQ.loading} error={docsQ.error} empty={docs.length===0}
                emptyMsg="No documents yet. Upload your first document above." onRetry={()=>setRefreshKey(k=>k+1)}>
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <tbody>
                      {docs.map(doc=>(
                        <tr key={doc.id} className="border-b border-[#1c3828]/40 last:border-0 hover:bg-coal-green/[0.03] transition-colors group">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <FileText size={11} className="text-[#6b7280] flex-shrink-0"/>
                              <span className="text-white text-xs font-medium truncate max-w-[150px]">{doc.originalName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-[#9ab5a0] uppercase text-[10px]">{doc.mimeType.split('/')[1]?.toUpperCase().slice(0,4)||'—'}</td>
                          <td className="px-4 py-2.5 text-[#6b7280] text-[10px] tabular-nums">{(doc.sizeByes/1024).toFixed(0)} KB</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${doc.status==='READY'?'text-coal-green border-coal-green/20':doc.status==='ERROR'?'text-red-400 border-red-500/20':'text-yellow-400 border-yellow-500/20'}`}>
                              {doc.processingProgress&&doc.status!=='READY'&&doc.status!=='ERROR'?`${doc.processingProgress}%`:doc.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {doc.status==='READY'&&<button onClick={()=>setActiveDocs(p=>p.some(d=>d.id===doc.id)?p:[doc,...p])} title="View extracted"><Eye size={12} className="text-[#6b7280] hover:text-coal-green"/></button>}
                              <button onClick={async()=>{if(!confirm('Delete?'))return;await documentsApi.delete(doc.id);setRefreshKey(k=>k+1)}} title="Delete"><Trash2 size={12} className="text-[#6b7280] hover:text-red-400"/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ApiState>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
