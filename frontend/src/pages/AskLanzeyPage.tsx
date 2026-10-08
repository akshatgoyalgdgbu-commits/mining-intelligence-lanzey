/**
 * Panel 13 — Ask LANZEY
 * Chat interface, suggested queries, AI answer + confidence + sources.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Brain, Search, Sparkles, BarChart3, FileText } from 'lucide-react'
import { useReducedMotion, useStaggeredReveal } from '@/hooks'
import { ScrollReveal } from '@/components/common/ScrollReveal'
import { queryApi, type QueryResult } from '@/services/api'
import { useLocation } from 'react-router-dom'

type Phase = 'idle'|'analyzing'|'retrieving'|'generating'|'done'

const STEPS = [
  { phase:'analyzing',  icon:Brain,    label:'Analyzing documents...'  },
  { phase:'retrieving', icon:Search,   label:'Retrieving evidence...'  },
  { phase:'generating', icon:Sparkles, label:'Generating insight...'   },
] as const

const SUGGESTED = [
  'What is the total coal reserve of Mine X?',
  'Show production trend for last 5 years',
  'Geological seam details — Nigahi Mine',
  'Environmental compliance status Q3 2026',
  'Generate reserve report for NCL mines',
  'Risk summary for all operational sites',
]

function ProcessingState({ phase, reduced }: { phase: Phase; reduced: boolean }) {
  const si = phase==='analyzing'?0:phase==='retrieving'?1:2
  const vis = useStaggeredReveal(3, reduced?0:200, phase!=='idle'&&phase!=='done')
  if (phase==='idle'||phase==='done') return null
  return (
    <div className="flex flex-col gap-2 py-3 px-4 rounded-xl border border-[#1c3828] mb-4" style={{background:'rgba(18,35,24,0.6)'}}>
      {STEPS.map((s,i)=>{
        const Icon=s.icon; const isActive=i===si; const isDone=i<si
        return (
          <div key={s.phase} className={`flex items-center gap-3 transition-all duration-300 ${vis[i]||reduced?'opacity-100 translate-x-0':'opacity-0 -translate-x-3'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isDone?'bg-coal-green/20 border border-coal-green/40':isActive?'bg-coal-green/10 border border-coal-green/30':'bg-[#122318] border border-[#1c3828]'}`}>
              <Icon size={11} className={isDone||isActive?'text-coal-green':'text-[#6b7280]'}/>
            </div>
            <span className={`text-xs ${isDone?'text-coal-green line-through decoration-coal-green/40':isActive?'text-white font-medium':'text-[#6b7280]'}`}>{s.label}</span>
            {isActive&&!reduced&&(
              <span className="flex gap-0.5 ml-auto">
                {[0,1,2].map(j=><span key={j} className="w-1 h-1 rounded-full bg-coal-green" style={{animation:`status-pulse 1.2s ease-in-out ${j*200}ms infinite`}}/>)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AnswerPanel({ result, reduced }: { result: QueryResult; reduced: boolean }) {
  const parts = useStaggeredReveal(3, reduced?0:140, true)
  return (
    <div className="space-y-3 animate-fade-up">
      {/* Answer */}
      <div className={`${reduced?'':'transition-all duration-500'} ${parts[0]||reduced?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="ai-badge"><span className="w-1.5 h-1.5 rounded-full bg-coal-green flex-shrink-0"/>AI Insight</div>
          <span className="text-[#6b7280] text-xs capitalize">{result.intent?.replace('_',' ')||'query result'}</span>
        </div>
        <div className="rounded-xl border border-[#1c3828] p-4" style={{background:'#0e1f16'}}>
          <p className="text-[#9ab5a0] text-sm leading-relaxed whitespace-pre-wrap">{result.answer}</p>
        </div>
      </div>

      {/* Sources */}
      {result.sources.length>0&&(
        <div className={`${reduced?'':'transition-all duration-500'} ${parts[1]||reduced?'opacity-100 translate-y-0':'opacity-0 translate-y-3'}`}
          style={reduced?{}:{transitionDelay:'140ms'}}>
          <div className="rounded-xl border border-[#1c3828] p-3" style={{background:'#0e1f16'}}>
            <p className="text-coal-green text-[10px] font-semibold uppercase tracking-widest mb-2">Source References</p>
            {result.sources.map((s,i)=>(
              <div key={i} className="flex items-start gap-2 py-1.5 border-b border-[#1c3828]/40 last:border-0">
                <span className="text-[#6b7280] text-xs w-5">[{i+1}]</span>
                <div>
                  <p className="text-white text-xs font-medium">{s.doc||s.source||'—'}</p>
                  {s.page&&<p className="text-[#6b7280] text-[10px]">Page {s.page}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.sources.length===0&&<p className="text-[#6b7280] text-xs italic">{result.disclaimer}</p>}

      {/* Confidence */}
      <div className={`flex items-center gap-3 p-3 rounded-xl border border-[#1c3828] ${reduced?'':'transition-all duration-500'} ${parts[2]||reduced?'opacity-100 translate-y-0':'opacity-0 translate-y-2'}`}
        style={{...(!reduced?{transitionDelay:'280ms'}:{}),background:'#0e1f16'}}>
        <BarChart3 size={13} className="text-coal-green flex-shrink-0"/>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#6b7280] text-xs">Answer confidence</span>
            <span className="text-coal-green text-xs font-bold tabular-nums">{Math.round(result.confidence*100)}%</span>
          </div>
          <div className="progress-bar"><div className="progress-bar-fill" style={{width:`${result.confidence*100}%`}}/></div>
        </div>
      </div>
    </div>
  )
}

export function AskLanzeyPage() {
  const reduced = useReducedMotion()
  const location = useLocation()
  const [query, setQuery]     = useState('')
  const [phase, setPhase]     = useState<Phase>('idle')
  const [result, setResult]   = useState<QueryResult|null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const DELAYS = reduced?[0,0,0]:[700,1400,2100]

  // Pre-fill from URL query param
  useEffect(()=>{
    const q=new URLSearchParams(location.search).get('q')
    if(q) setQuery(q)
  },[location.search])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if(!query.trim()||phase!=='idle') return
    setPhase('analyzing'); setResult(null)
    const phases:Phase[]=['analyzing','retrieving','generating']
    phases.forEach((p,i)=>setTimeout(()=>setPhase(p),DELAYS[i]))
    try {
      const r=await queryApi.ask(query)
      setTimeout(()=>{setResult(r);setPhase('done')},DELAYS[2]+400)
    } catch {
      setTimeout(()=>{
        setResult({question:query,intent:'error',answer:'Could not connect to the backend. Ensure the server is running on port 4000.',data:null,sources:[],confidence:0,disclaimer:'Backend unavailable.'})
        setPhase('done')
      },DELAYS[2]+400)
    }
  }

  function reset() { setPhase('idle'); setQuery(''); setResult(null); setTimeout(()=>textareaRef.current?.focus(),100) }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ScrollReveal className="mb-6">
        <p className="text-coal-green text-xs font-semibold tracking-widest uppercase mb-1">AI Workspace</p>
        <h1 className="text-white text-2xl font-bold">Ask LANZEY</h1>
        <p className="text-[#6b7280] text-sm mt-1">Get instant answers from your documents, data and reports.</p>
      </ScrollReveal>

      {/* Suggested queries */}
      {phase==='idle'&&(
        <ScrollReveal className="flex flex-wrap gap-2 mb-5" delay={100}>
          {SUGGESTED.map(q=>(
            <button key={q} onClick={()=>setQuery(q)}
              className="px-3 py-1.5 rounded-full text-xs border border-[#1c3828] text-[#9ab5a0] hover:border-coal-green/40 hover:text-coal-green transition-all duration-150">
              {q}
            </button>
          ))}
        </ScrollReveal>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="mb-5">
        <div className={`rounded-xl border overflow-hidden transition-all duration-200 ${phase!=='idle'?'border-[#1c3828] opacity-60':'border-[#1c3828] focus-within:border-coal-green/40'}`} style={{background:'#0e1f16'}}>
          <textarea ref={textareaRef} value={query}
            onChange={e=>phase==='idle'&&setQuery(e.target.value)}
            placeholder="What is the total coal reserve of Mine X? Show production trends..."
            rows={3} disabled={phase!=='idle'}
            className="w-full bg-transparent px-5 py-4 text-sm text-white placeholder:text-[#6b7280] resize-none focus:outline-none disabled:cursor-not-allowed"
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSubmit(e)}}}/>
          <div className="flex items-center justify-between px-4 pb-3">
            <span className="text-[#6b7280] text-xs">↵ Enter to submit · Shift+Enter for new line</span>
            {phase==='done'
              ?<button type="button" onClick={reset} className="btn-ghost text-xs py-1.5 px-3">New question</button>
              :<button type="submit" disabled={!query.trim()||phase!=='idle'} className="btn-primary py-1.5 px-4 text-xs gap-1.5">
                <Send size={12}/> Analyze
              </button>
            }
          </div>
        </div>
      </form>

      <ProcessingState phase={phase} reduced={reduced}/>
      {phase==='done'&&result&&<AnswerPanel result={result} reduced={reduced}/>}
    </div>
  )
}
