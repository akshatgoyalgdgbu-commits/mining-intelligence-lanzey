/**
 * AppLayout — shared shell for all authenticated pages.
 * Sidebar matches screenshot exactly: icons + labels, collapsible.
 * Top bar: search + bell + user info.
 */

import { useState } from 'react'
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileSearch, MessageSquareText, AlertTriangle,
  FileStack, FileText, Users2, Database, Settings, LogOut,
  Leaf, Bell, Search, ChevronLeft, ChevronRight, User,
  BarChart3, Shield, ClipboardList, CheckSquare,
} from 'lucide-react'
import { useAuth }          from '@/context/AuthContext'
import { useReducedMotion } from '@/hooks'

const NAV_ITEMS = [
  { icon: LayoutDashboard,   label: 'Dashboard',    href: '/dashboard'        },
  { icon: FileStack,         label: 'Documents',    href: '/documents'        },
  { icon: FileSearch,        label: 'OCR Results',  href: '/ocr-results'      },
  { icon: CheckSquare,       label: 'HITL Review',  href: '/hitl'             },
  { icon: Database,          label: 'Knowledge',    href: '/knowledge'        },
  { icon: MessageSquareText, label: 'Ask LANZEY',   href: '/ask'              },
  { icon: AlertTriangle,     label: 'Risk Intel',   href: '/risk'             },
  { icon: BarChart3,         label: 'Analytics',    href: '/reports/generate' },
  { icon: ClipboardList,     label: 'Audit Trail',  href: '/audit'            },
  { icon: Shield,            label: 'Official Q',   href: '/query/official'   },
] as const

const BOTTOM_ITEMS = [
  { icon: Settings, label: 'Settings', href: '/settings' },
] as const

function SidebarItem({ icon: Icon, label, href, collapsed }: {
  icon: React.ElementType; label: string; href: string; collapsed: boolean
}) {
  const [tip, setTip] = useState(false)
  return (
    <div className="relative" onMouseEnter={() => collapsed && setTip(true)} onMouseLeave={() => setTip(false)}>
      <NavLink to={href}
        className={({ isActive }) => [
          'flex items-center gap-3 rounded-lg transition-all duration-150 group/nav',
          collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2.5 w-full',
          isActive
            ? 'bg-coal-green/10 text-coal-green border border-coal-green/20'
            : 'text-[#9ab5a0] hover:text-white hover:bg-[#1c3828]/60 border border-transparent',
        ].join(' ')}>
        <Icon size={17} className="flex-shrink-0 transition-transform duration-150 group-hover/nav:scale-105" />
        {!collapsed && <span className="text-xs font-medium whitespace-nowrap">{label}</span>}
      </NavLink>
      {collapsed && tip && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-2 py-1 rounded-md
          bg-[#0f2018] border border-[#1c3828] text-white text-xs whitespace-nowrap pointer-events-none">
          {label}
        </div>
      )}
    </div>
  )
}

export function AppLayout() {
  const { user, logout }  = useAuth()
  const reduced           = useReducedMotion()
  const navigate          = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch]       = useState('')

  const ROLE_COLOR: Record<string, string> = {
    ADMIN: 'text-red-400', CIL: 'text-coal-green', CMPDI: 'text-yellow-400',
    GEOLOGICAL: 'text-cyan-400', ENVIRONMENT: 'text-green-400',
    MACHINERY: 'text-purple-400', RESERVE_CHECKER: 'text-blue-400',
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) navigate(`/ask?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0b1a14' }}>

      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col h-full flex-shrink-0 relative z-20"
        style={{
          width:      collapsed ? 60 : 220,
          minWidth:   collapsed ? 60 : 220,
          background: '#0a1610',
          borderRight: '1px solid #1c3828',
          transition: reduced ? 'none' : 'width 220ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center h-14 border-b border-[#1c3828] px-3 gap-2.5 overflow-hidden flex-shrink-0">
          <div className="w-7 h-7 rounded-md bg-coal-green flex items-center justify-center flex-shrink-0">
            <Leaf size={14} className="text-[#0b1a14]" fill="currentColor" />
          </div>
          {!collapsed && (
            <div style={{ transition: reduced ? 'none' : 'opacity 180ms ease 60ms', opacity: collapsed ? 0 : 1 }}>
              <p className="text-white font-black text-sm leading-none">LANZEY</p>
              <p className="text-[#9ab5a0] text-[9px] leading-none mt-0.5">Coal Intelligence</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 flex flex-col gap-0.5 overflow-hidden px-2">
          {NAV_ITEMS.map(item => (
            <SidebarItem key={item.href} {...item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="py-3 border-t border-[#1c3828] flex flex-col gap-0.5 px-2">
          {BOTTOM_ITEMS.map(item => (
            <SidebarItem key={item.href} {...item} collapsed={collapsed} />
          ))}
          <button
            onClick={logout}
            className="flex items-center gap-3 rounded-lg transition-all duration-150 px-3 py-2.5 w-full text-[#9ab5a0] hover:text-red-400 hover:bg-red-500/10 border border-transparent"
          >
            <LogOut size={17} className="flex-shrink-0" />
            {!collapsed && <span className="text-xs font-medium">Logout</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? 'Expand' : 'Collapse'}
          className="absolute -right-3 top-[3.6rem] z-30 w-6 h-6 rounded-full flex items-center justify-center
            bg-[#0a1610] border border-[#1c3828] text-[#6b7280] hover:text-coal-green hover:border-coal-green/40
            transition-all duration-200 focus-visible:outline-none"
        >
          {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
        </button>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-4 px-5 h-14 flex-shrink-0 border-b border-[#1c3828]"
          style={{ background: 'rgba(10,22,15,0.95)', backdropFilter: 'blur(8px)' }}>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-sm">
            <div className="flex items-center gap-2 bg-[#122318] border border-[#1c3828] rounded-lg px-3 py-1.5
              focus-within:border-coal-green/40 transition-colors duration-200">
              <Search size={13} className="text-[#6b7280] flex-shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search anything..."
                className="bg-transparent text-white text-xs placeholder:text-[#6b7280] focus:outline-none flex-1 w-full"
              />
            </div>
          </form>

          <div className="flex items-center gap-3 ml-auto">
            {/* Bell */}
            <button className="relative w-8 h-8 rounded-lg flex items-center justify-center
              text-[#9ab5a0] hover:text-white hover:bg-[#1c3828] transition-colors duration-150">
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-coal-green border border-[#0a1610]" />
            </button>

            {/* User */}
            {user && (
              <div className="flex items-center gap-2 pl-3 border-l border-[#1c3828]">
                <div className="w-7 h-7 rounded-full bg-coal-green/20 border border-coal-green/30 flex items-center justify-center">
                  <User size={13} className="text-coal-green" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-white text-xs font-semibold leading-none">{user.name}</p>
                  <p className={`text-[10px] font-medium leading-none mt-0.5 ${ROLE_COLOR[user.role] || 'text-[#9ab5a0]'}`}>
                    {user.role}
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: '#0b1a14' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
