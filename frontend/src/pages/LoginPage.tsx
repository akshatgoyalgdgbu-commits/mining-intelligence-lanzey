/**
 * Panel 2 — Login Page
 * Matches screenshot: LANZEY logo, "AI-Powered Coal Intelligence Portal",
 * Email/Employee ID + Password fields, Remember me, Forgot password,
 * Login button, "Or login with" SSO (CIL SSO + Government SSO).
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Leaf, Eye, EyeOff, AlertCircle, Loader2, Building2, Shield } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const ROLE_ROUTES: Record<string, string> = {
  ADMIN:           '/dashboard/admin',
  CIL:             '/dashboard/cil',
  CMPDI:           '/dashboard/cmpdi',
  GEOLOGICAL:      '/dashboard/geological',
  ENVIRONMENT:     '/dashboard/environment',
  MACHINERY:       '/dashboard/machinery',
  RESERVE_CHECKER: '/dashboard/reserve',
}

const DEMO = [
  { label: 'Admin',     email: 'admin@lanzey.in'   },
  { label: 'CIL',       email: 'cil@lanzey.in'     },
  { label: 'Geo',       email: 'geo@lanzey.in'      },
  { label: 'Machinery', email: 'mach@lanzey.in'     },
  { label: 'Reserve',   email: 'reserve@lanzey.in'  },
]

export function LoginPage() {
  const navigate     = useNavigate()
  const [params]     = useSearchParams()
  const { login, isAuthenticated, user } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('lanzey123')
  const [showPwd,  setShowPwd]  = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirect = params.get('redirect')
      navigate(redirect || ROLE_ROUTES[user.role] || '/dashboard', { replace: true })
    }
  }, [isAuthenticated, user, navigate, params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setError(''); setLoading(true)
    try {
      const u = await login(email, password)
      const redirect = params.get('redirect')
      navigate(redirect || ROLE_ROUTES[u.role] || '/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0b1a14' }}>

      {/* Left panel — mining image */}
      <div className="hidden lg:flex flex-col justify-end flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/images/mining-bg.png')` }} />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(4,10,7,0.7) 0%, rgba(4,10,7,0.4) 100%)' }} />
        <div className="relative z-10 p-12">
          <p className="text-coal-green text-xs font-semibold tracking-widest uppercase mb-2">LANZEY</p>
          <h2 className="text-white text-3xl font-black leading-tight mb-3">
            AI-Powered<br />Coal Intelligence
          </h2>
          <p className="text-[#9ab5a0] text-sm max-w-xs leading-relaxed">
            Transform raw mining documents into actionable intelligence. Smarter decisions, safer operations, greener future.
          </p>
          <div className="flex gap-4 mt-8">
            {[
              { label: 'Data Intelligence' },
              { label: 'Sustainability' },
              { label: 'A Stronger India' },
            ].map(item => (
              <div key={item.label} className="px-3 py-1.5 rounded-full border border-coal-green/30 bg-coal-green/10">
                <span className="text-coal-green text-xs font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-col justify-center w-full max-w-md px-8 py-12"
        style={{ background: '#0a1610', borderLeft: '1px solid #1c3828' }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-coal-green flex items-center justify-center">
            <Leaf size={20} className="text-[#0b1a14]" fill="currentColor" />
          </div>
          <div>
            <p className="text-white font-black text-lg tracking-wide">LANZEY</p>
            <p className="text-[#9ab5a0] text-[10px] tracking-widest">AI-Powered Coal Intelligence Portal</p>
          </div>
        </div>

        <h1 className="text-white text-2xl font-bold mb-1">Sign In</h1>
        <p className="text-[#6b7280] text-sm mb-6">Access your department workspace</p>

        {/* Quick demo fill */}
        <div className="mb-5">
          <p className="text-[#6b7280] text-[10px] uppercase tracking-widest mb-2">Quick demo access</p>
          <div className="flex flex-wrap gap-1.5">
            {DEMO.map(d => (
              <button key={d.email} type="button"
                onClick={() => { setEmail(d.email); setPassword('lanzey123'); setError('') }}
                className="px-2.5 py-1 text-[10px] rounded-full border border-[#1c3828] text-[#9ab5a0]
                  hover:border-coal-green/40 hover:text-coal-green transition-all duration-150">
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 mb-4 animate-fade-in">
            <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-xs">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#9ab5a0] text-xs font-medium mb-1.5">Email / Employee ID</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@lanzey.in" required autoComplete="email"
              className="w-full bg-[#122318] border border-[#1c3828] rounded-xl px-4 py-3 text-white text-sm
                placeholder:text-[#6b7280] focus:outline-none focus:border-coal-green/50 transition-colors" />
          </div>

          <div>
            <label className="block text-[#9ab5a0] text-xs font-medium mb-1.5">Password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
                className="w-full bg-[#122318] border border-[#1c3828] rounded-xl px-4 py-3 pr-10 text-white text-sm
                  placeholder:text-[#6b7280] focus:outline-none focus:border-coal-green/50 transition-colors" />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white transition-colors">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[#1c3828] accent-coal-green" />
              <span className="text-[#9ab5a0] text-xs">Remember me</span>
            </label>
            <button type="button" className="text-coal-green text-xs hover:underline">Forgot password?</button>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-coal-green text-[#0b1a14] font-bold text-sm
              hover:bg-[#33d46e] transition-all duration-200 hover:-translate-y-0.5
              disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in...</> : 'Login'}
          </button>
        </form>

        {/* SSO */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#1c3828]" />
            <span className="text-[#6b7280] text-xs">Or login with</span>
            <div className="flex-1 h-px bg-[#1c3828]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Building2, label: 'CIL SSO',        color: '#00c853' },
              { icon: Shield,    label: 'Government SSO',  color: '#29b6f6' },
            ].map(sso => (
              <button key={sso.label}
                onClick={() => setError('SSO not configured in demo mode.')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#1c3828]
                  text-[#9ab5a0] text-xs font-medium hover:border-[#1c3828]/60 hover:bg-[#122318]
                  transition-all duration-150">
                <sso.icon size={14} style={{ color: sso.color }} />
                {sso.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-[#6b7280] text-xs">
          Demo password: <span className="text-coal-green font-mono">lanzey123</span>
        </p>
        <p className="mt-2 text-center">
          <Link to="/" className="text-coal-green text-xs hover:underline">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
