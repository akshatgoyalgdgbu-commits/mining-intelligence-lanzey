/**
 * Panel 3 — Role Selection Page
 * "Select Your Role / Department" — department cards grid.
 * Shown after login for ADMIN who can access any dept.
 */

import { useNavigate } from 'react-router-dom'
import { Building2, HardHat, Mountain, Leaf, Cpu, Database, UserCog } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const DEPARTMENTS = [
  { icon: Building2, code: 'CIL',  name: 'CIL',          sub: 'Operations & Data-backed',          color: '#00c853', bg: '#003d1a', href: '/dashboard/cil',         desc: 'Operations Dashboard' },
  { icon: HardHat,   code: 'CMPDI',name: 'CMPDI',        sub: 'Geological & Resource Assessment',   color: '#ffb300', bg: '#3d2a00', href: '/dashboard/cmpdi',       desc: 'Geo Resource Assessment' },
  { icon: Mountain,  code: 'GEO',  name: 'Geological',   sub: 'Data & Geological Analysis',         color: '#00acc1', bg: '#003840', href: '/dashboard/geological',  desc: 'Geological Analysis' },
  { icon: Leaf,      code: 'ENV',  name: 'Environmental',sub: 'Sustainability & Clearances',         color: '#43a047', bg: '#0d2e10', href: '/dashboard/environment', desc: 'Environmental Clearances' },
  { icon: Cpu,       code: 'MACH', name: 'Machinery',    sub: 'Equipment & Operational Feasibility', color: '#7c4dff', bg: '#1a0d3d', href: '/dashboard/machinery',   desc: 'Equipment Feasibility' },
  { icon: Database,  code: 'RSV',  name: 'Reserve',      sub: 'Coal Reserve Verification',           color: '#29b6f6', bg: '#002940', href: '/dashboard/reserve',     desc: 'Reserve Verification' },
  { icon: UserCog,   code: 'ADM',  name: 'Administrative',sub: 'User Management & System Control',  color: '#ec407a', bg: '#3d0018', href: '/dashboard/admin',       desc: 'System Control' },
] as const

export function RoleSelectPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: '#0b1a14' }}>
      <div className="w-full max-w-3xl animate-fade-up">
        <div className="text-center mb-10">
          <p className="text-coal-green text-xs font-semibold tracking-widest uppercase mb-2">LANZEY</p>
          <h1 className="text-white text-2xl font-bold mb-1">Select Your Role / Department</h1>
          <p className="text-[#6b7280] text-sm">Access your workspace and AI-powered insights</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {DEPARTMENTS.map((dept, i) => {
            const Icon = dept.icon
            return (
              <button
                key={dept.code}
                onClick={() => navigate(dept.href)}
                className="group flex flex-col items-center gap-3 p-5 rounded-xl border border-[#1c3828]
                  hover:-translate-y-1 hover:border-[#00c853]/30 transition-all duration-250 text-center"
                style={{
                  background: '#0e1f16',
                  animationDelay: `${i * 60}ms`,
                }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: dept.bg, border: `1px solid ${dept.color}25` }}>
                  <Icon size={22} style={{ color: dept.color }} />
                </div>
                <div>
                  <p className="text-white text-sm font-bold leading-tight">{dept.name}</p>
                  <p className="text-[#6b7280] text-[10px] mt-0.5 leading-snug">{dept.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        <p className="text-center text-[#6b7280] text-xs mt-8">
          Logged in as <span className="text-white font-medium">{user?.name}</span> ·{' '}
          <span className="text-coal-green">{user?.role}</span>
        </p>
      </div>
    </div>
  )
}
