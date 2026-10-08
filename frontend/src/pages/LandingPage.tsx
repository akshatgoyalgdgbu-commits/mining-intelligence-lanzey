/**
 * Panel 1 — Landing Page (preserved exactly)
 * Mining background, POWERING A SUSTAINABLE TOMORROW, nav, dept cards.
 */
import { Link } from 'react-router-dom'
import {
  ArrowRight, Upload, Settings2, BarChart3, FileText, CheckCircle2,
  Shield, Leaf, Zap, Users, Building2, HardHat, Mountain, Cpu,
  Database, UserCog, ChevronRight, Users2,
} from 'lucide-react'
import { useReducedMotion, useStaggeredReveal } from '@/hooks'
import { ScrollReveal } from '@/components/common/ScrollReveal'

const NAV_LINKS = [
  { label:'Home',         href:'#hero'        },
  { label:'About',        href:'#about'       },
  { label:'Our Solution', href:'#solution'    },
  { label:'Impact',       href:'#departments' },
  { label:'Contact',      href:'#contact'     },
]
function scrollTo(id:string){ const el=document.getElementById(id.replace('#','')); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}) }

function TopNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-14"
      style={{background:'rgba(6,12,9,0.88)',backdropFilter:'blur(14px)',borderBottom:'1px solid rgba(28,56,40,0.5)'}}>
      <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-9 h-9 rounded-lg bg-coal-green flex items-center justify-center flex-shrink-0">
          <Leaf size={18} className="text-coal-bg" fill="currentColor"/>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-white font-black text-sm tracking-wide uppercase">Coal Intelligence Portal</span>
          <span className="text-coal-subtle text-[10px] tracking-widest">Data &nbsp;|&nbsp; AI &nbsp;|&nbsp; Sustainable Mining</span>
        </div>
      </Link>
      <div className="hidden md:flex items-center gap-6">
        {NAV_LINKS.map((item,i)=>(
          <button key={item.label} onClick={()=>scrollTo(item.href)}
            className={`text-sm font-medium transition-colors duration-150 relative pb-0.5 ${i===0?'nav-link-active':'text-coal-subtle hover:text-white'}`}>
            {item.label}
          </button>
        ))}
      </div>
      <Link to="/login"
        className="hidden md:inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-coal-green text-coal-bg text-sm font-bold
          transition-all duration-200 hover:bg-coal-green-glow hover:-translate-y-0.5
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coal-green">
        Login <ArrowRight size={14}/>
      </Link>
    </nav>
  )
}

const PIPELINE_STEPS = [
  { icon:Upload,       label:'Upload Documents' },
  { icon:Settings2,    label:'AI Extracts Information' },
  { icon:BarChart3,    label:'Generate Insights',     highlight:true },
  { icon:FileText,     label:'Automated Reports' },
  { icon:CheckCircle2, label:'Smarter Mining Decisions' },
] as const

function FromDocumentsCard() {
  const reduced = useReducedMotion()
  const visible = useStaggeredReveal(PIPELINE_STEPS.length,120,true)
  return (
    <div className={`w-60 flex-shrink-0 rounded-2xl overflow-hidden border border-[#1c3828] ${reduced?'':'animate-slide-in-right'}`}
      style={{background:'rgba(8,16,11,0.90)',backdropFilter:'blur(16px)',animationDelay:'0.4s',animationFillMode:'both'}}>
      <div className="px-4 py-3 border-b border-[#1c3828]">
        <h3 className="text-white font-bold text-sm leading-snug">From Documents<br/>to Decisions</h3>
      </div>
      <div className="px-2 py-2 space-y-0.5">
        {PIPELINE_STEPS.map((step,i)=>{
          const Icon=step.icon
          return (
            <div key={step.label}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all duration-300 ${step.highlight?'bg-coal-green/10 border border-coal-green/20':''} ${visible[i]||reduced?'opacity-100 translate-x-0':'opacity-0 -translate-x-3'}`}
              style={{transitionDelay:reduced?'0ms':`${i*80}ms`}}>
              <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${step.highlight?'bg-coal-green/20':'bg-[#1c3828]'}`}>
                <Icon size={14} className={step.highlight?'text-coal-green':'text-coal-subtle'}/>
              </div>
              <span className={`text-xs font-medium ${step.highlight?'text-coal-green':'text-coal-text'}`}>{step.label}</span>
            </div>
          )
        })}
      </div>
      <div className="px-4 py-3 border-t border-[#1c3828]">
        <p className="script-text text-right">Mining for a<br/>Greener Future!</p>
      </div>
    </div>
  )
}

const VALUE_PROPS = [
  { icon:Shield, title:'Safer Operations',        desc:'Data-backed risk decisions'   },
  { icon:Leaf,   title:'Sustainable Mining',       desc:'Minimize environmental impact'},
  { icon:Zap,    title:'Efficient Resource Use',   desc:'AI-optimised scheduling'      },
  { icon:Users,  title:'Collaborative Governance', desc:'One platform, every dept.'    },
] as const

const DEPARTMENTS = [
  { icon:Building2, code:'CIL',  name:'CIL',          desc:'Operations & data-backed',         color:'#00c853', iconBg:'#003d1a', href:'/login?redirect=/dashboard/cil'         },
  { icon:HardHat,   code:'CMPDI',name:'CMPDI',        desc:'Geological & Resource Assessment',  color:'#ffb300', iconBg:'#3d2a00', href:'/login?redirect=/dashboard/cmpdi'       },
  { icon:Mountain,  code:'GEO',  name:'Geological',   desc:'Site & Geological Analysis',        color:'#00acc1', iconBg:'#003840', href:'/login?redirect=/dashboard/geological'  },
  { icon:Leaf,      code:'ENV',  name:'Environmental',desc:'Sustainability & Clearances',        color:'#43a047', iconBg:'#0d2e10', href:'/login?redirect=/dashboard/environment' },
  { icon:Cpu,       code:'MACH', name:'Machinery',    desc:'Equipment & Feasibility',           color:'#7c4dff', iconBg:'#1a0d3d', href:'/login?redirect=/dashboard/machinery'   },
  { icon:Database,  code:'RSV',  name:'Reserve',      desc:'Coal Reserve Verification',         color:'#29b6f6', iconBg:'#002940', href:'/login?redirect=/dashboard/reserve'     },
  { icon:UserCog,   code:'ADM',  name:'Admin',        desc:'User & System Control',             color:'#ec407a', iconBg:'#3d0018', href:'/login?redirect=/dashboard/admin'       },
] as const

export function LandingPage() {
  const reduced     = useReducedMotion()
  const deptVisible = useStaggeredReveal(DEPARTMENTS.length,65,true)

  return (
    <div className="min-h-screen bg-coal-bg text-coal-text overflow-x-hidden">
      <TopNav/>

      {/* ── HERO ── */}
      <section id="hero" className="relative min-h-screen flex flex-col pt-14 overflow-hidden">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <div className={`absolute inset-0 bg-cover bg-center bg-no-repeat ${reduced?'':'animate-bg-zoom'}`}
            style={{backgroundImage:`url('/images/mining-bg.png')`,willChange:reduced?'auto':'transform'}}/>
          <div className="absolute inset-0"
            style={{background:'linear-gradient(105deg, rgba(4,10,7,0.93) 0%, rgba(4,10,7,0.75) 42%, rgba(4,10,7,0.20) 100%)'}}/>
          <div className="absolute bottom-0 left-0 right-0 h-48"
            style={{background:'linear-gradient(to bottom, transparent, #0b1a14)'}}/>
          <div className="absolute top-0 left-0 right-0 h-24"
            style={{background:'linear-gradient(to bottom, rgba(4,10,7,0.5), transparent)'}}/>
        </div>
        <div className="relative z-10 flex-1 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-10">
            <div className="flex items-center justify-between gap-8">
              <div className="flex flex-col max-w-xl">
                <p className={`text-coal-subtle text-xs font-semibold tracking-[0.25em] uppercase mb-4 ${reduced?'':'animate-fade-up hero-stagger-1 opacity-0'}`}>
                  Smart Data &nbsp;|&nbsp; Better Decisions &nbsp;|&nbsp; Greener Tomorrow
                </p>
                <h1 className="font-black leading-[0.93] tracking-tight mb-5">
                  <span className={`block text-white ${reduced?'':'animate-fade-up hero-stagger-2 opacity-0'}`} style={{fontSize:'clamp(2.8rem,6vw,4.5rem)'}}>POWERING</span>
                  <span className={`block ${reduced?'':'animate-fade-up hero-stagger-3 opacity-0'}`} style={{fontSize:'clamp(2.8rem,6vw,4.5rem)'}}>
                    A <span className="text-sweep" aria-label="SUSTAINABLE">SUSTAINABLE</span>
                  </span>
                  <span className={`block text-white ${reduced?'':'animate-fade-up hero-stagger-4 opacity-0'}`} style={{fontSize:'clamp(2.8rem,6vw,4.5rem)'}}>TOMORROW</span>
                </h1>
                <p className={`text-coal-subtle text-base md:text-lg leading-relaxed mb-6 max-w-sm ${reduced?'':'animate-fade-up hero-stagger-5 opacity-0'}`}>
                  AI-driven insights for smarter, safer<br/>and more responsible coal mining.
                </p>
                <div className={`flex gap-3 mb-8 ${reduced?'':'animate-fade-up hero-stagger-6 opacity-0'}`}>
                  <Link to="/login" className="group/btn btn-primary text-sm px-6 py-3">
                    Get Started <ArrowRight size={16} className="arrow-shift flex-shrink-0" aria-hidden/>
                  </Link>
                  <Link to="/login" className="group/btn btn-secondary text-sm px-6 py-3">
                    Login <ChevronRight size={16} className="arrow-shift flex-shrink-0" aria-hidden/>
                  </Link>
                </div>
                <div className={`grid grid-cols-2 gap-3 ${reduced?'':'animate-fade-up opacity-0'}`}
                  style={reduced?{}:{animationDelay:'850ms',animationFillMode:'both'}}>
                  {VALUE_PROPS.map(v=>{
                    const Icon=v.icon
                    return (
                      <div key={v.title} className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{background:'rgba(0,200,83,0.12)',border:'1px solid rgba(0,200,83,0.2)'}}>
                          <Icon size={15} className="text-coal-green"/>
                        </div>
                        <div>
                          <p className="text-white text-xs font-bold leading-tight">{v.title}</p>
                          <p className="text-coal-subtle text-[11px] leading-snug">{v.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="hidden lg:block flex-shrink-0"><FromDocumentsCard/></div>
            </div>
          </div>
        </div>
        <div className={`relative z-10 flex justify-center pb-5 ${reduced?'':'animate-fade-in opacity-0'}`}
          style={reduced?{}:{animationDelay:'1.4s',animationFillMode:'both'}}>
          <div className="flex flex-col items-center gap-1 opacity-40">
            <span className="text-[10px] text-coal-subtle tracking-widest uppercase">Scroll</span>
            <div className="w-px h-6 bg-coal-subtle rounded-full"/>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="bg-coal-surface py-16 px-6 md:px-10 border-t border-[#1c3828]">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-10">
            <p className="text-coal-green text-xs font-semibold tracking-widest uppercase mb-2">About LANZEY</p>
            <h2 className="text-white text-2xl md:text-3xl font-bold mb-3">Built for India's Coal Sector</h2>
            <p className="text-coal-subtle text-sm max-w-2xl mx-auto leading-relaxed">
              LANZEY is an AI-powered intelligence platform built exclusively for Indian coal mining companies — CIL, SCCL and their subsidiaries.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {title:'Founded on Mining Expertise',desc:'Built with domain experts from CCL, NCL, SECL and CMPDI.'},
              {title:'Document-First Intelligence',desc:'Every answer traces back to a source document and page.'},
              {title:'Made for Government Use',desc:'Parliamentary queries generated in minutes, not weeks.'},
            ].map(c=>(
              <ScrollReveal key={c.title}>
                <div className="bg-coal-card border border-[#1c3828] rounded-xl p-5">
                  <h3 className="text-white font-semibold text-sm mb-2">{c.title}</h3>
                  <p className="text-coal-muted text-xs leading-relaxed">{c.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR SOLUTION ── */}
      <section id="solution" className="bg-coal-bg py-16 px-6 md:px-10 border-t border-[#1c3828]">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-10">
            <p className="text-coal-green text-xs font-semibold tracking-widest uppercase mb-2">Our Solution</p>
            <h2 className="text-white text-2xl md:text-3xl font-bold">From Documents → Intelligence → Decisions</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {step:'01',title:'Upload Any Document',desc:'PDF, scanned images, Excel, Word — any format.'},
              {step:'02',title:'OCR + AI Extraction',desc:'Text extracted and structured fields identified automatically.'},
              {step:'03',title:'Knowledge Base',desc:'All data searchable and linked to source documents.'},
              {step:'04',title:'Ask LANZEY',desc:'Query your entire document corpus in plain language.'},
              {step:'05',title:'Automated Reports',desc:'Structured reports from real data in under 60 seconds.'},
              {step:'06',title:'Validate & Export',desc:'Review section by section, approve and export.'},
            ].map(item=>(
              <ScrollReveal key={item.step}>
                <div className="flex gap-4 bg-coal-card border border-[#1c3828] rounded-xl p-4">
                  <span className="text-coal-green text-2xl font-black opacity-30 flex-shrink-0">{item.step}</span>
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-coal-muted text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPARTMENTS ── */}
      <section id="departments" className="bg-coal-bg py-10 px-6 md:px-10 border-t border-[#1c3828]">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal className="text-center mb-7">
            <h2 className="text-white text-2xl md:text-3xl font-bold mb-1">Choose Your Department</h2>
            <p className="text-coal-subtle text-sm">Login to access your dedicated workspace</p>
          </ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {DEPARTMENTS.map((dept,i)=>{
              const Icon=dept.icon; const vis=deptVisible[i]
              return (
                <Link key={dept.code} to={dept.href}
                  className={`group/dept dept-card ${vis||reduced?'opacity-100 translate-y-0':'opacity-0 translate-y-5'} transition-all duration-500`}
                  style={{transitionDelay:reduced?'0ms':`${i*55}ms`}}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2.5 flex-shrink-0 transition-transform duration-220 group-hover/dept:scale-110"
                    style={{background:dept.iconBg,border:`1px solid ${dept.color}25`}}>
                    <Icon size={20} style={{color:dept.color}}/>
                  </div>
                  <p className="text-white text-sm font-bold mb-1 leading-tight">{dept.name}</p>
                  <p className="text-coal-subtle text-[11px] leading-snug flex-1">{dept.desc}</p>
                  <div className="dept-arrow mt-2.5"><ChevronRight size={14}/></div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="bg-coal-surface py-14 px-6 md:px-10 border-t border-[#1c3828]">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal>
            <p className="text-coal-green text-xs font-semibold tracking-widest uppercase mb-2">Contact</p>
            <h2 className="text-white text-2xl font-bold mb-3">Get in Touch</h2>
            <p className="text-coal-muted text-sm mb-6 leading-relaxed">Interested in deploying LANZEY at your mine site? Our team is ready to help.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[{label:'Email',value:'contact@lanzey.in'},{label:'Phone',value:'+91 11 2345 6789'},{label:'Location',value:'New Delhi, India'}].map(item=>(
                <div key={item.label} className="bg-coal-card border border-[#1c3828] rounded-xl p-4">
                  <p className="text-coal-muted text-[10px] uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-white text-sm font-medium">{item.value}</p>
                </div>
              ))}
            </div>
            <Link to="/login" className="group/btn btn-solid inline-flex items-center gap-2 px-8 py-3 text-sm">
              Request a Demo <ArrowRight size={15} className="arrow-shift"/>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1c3828]" style={{background:'rgba(6,12,9,0.97)'}}>
        <ScrollReveal>
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#1c3828]">
              {[
                {icon:Users2,   title:'One Platform',     sub:'Multiple Departments'  },
                {icon:Zap,      title:'Faster Decisions',  sub:'From Weeks to Minutes' },
                {icon:Leaf,     title:'Greener Future',    sub:'For Generations Ahead' },
                {isQuote:true,  quote:'"Responsible Mining\nStronger India"'},
              ].map((item,i)=>(
                <div key={i} className="flex items-center gap-3 px-6 py-4 first:pl-0">
                  {item.isQuote?(
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-orange-500/80 flex-shrink-0 flex items-center justify-center">
                        <span className="text-white text-[9px] font-black">IN</span>
                      </div>
                      <p className="text-coal-text text-sm font-bold leading-snug whitespace-pre-line">{item.quote}</p>
                    </div>
                  ):(
                    <>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{background:'rgba(0,200,83,0.10)',border:'1px solid rgba(0,200,83,0.2)'}}>
                        {item.icon&&<item.icon size={16} className="text-coal-green"/>}
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold">{item.title}</p>
                        <p className="text-coal-subtle text-xs">{item.sub}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </footer>
    </div>
  )
}
