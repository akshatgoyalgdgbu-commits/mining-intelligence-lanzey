/**
 * 56.10 — Sidebar with smooth expand ↔ collapse animation.
 *
 * What animates:
 *   - Width:  240 px ↔ 60 px, 220 ms cubic-bezier(0.4,0,0.2,1)
 *   - Labels: max-width + opacity fade (delay 60 ms when expanding)
 *   - Logo text: same fade/width trick
 *   - Tooltips: fade + 4 px slide when collapsed
 *   - Main content expands naturally because sidebar uses width (not position)
 *
 * Rules:
 *   - Icons always visible when collapsed
 *   - Sidebar does NOT slide dramatically across the screen
 *   - Hover tooltip appears in collapsed state (accessible)
 *   - Reduced-motion: instant width change, no label fade
 */

import { useState } from 'react'
import { NavLink }  from 'react-router-dom'
import {
  LayoutDashboard, FileSearch, MessageSquareText,
  AlertTriangle, FileStack, Settings,
  ChevronLeft, ChevronRight, Leaf, FileText, Users2, Database,
} from 'lucide-react'
import { useReducedMotion } from '@/hooks'

const NAV_ITEMS = [
  { icon: LayoutDashboard,   label: 'Dashboard',    href: '/dashboard'           },
  { icon: FileSearch,        label: 'Documents',    href: '/documents'           },
  { icon: Database,          label: 'Knowledge',    href: '/knowledge'           },
  { icon: MessageSquareText, label: 'Ask AI',       href: '/ask'                 },
  { icon: AlertTriangle,     label: 'Risk Intel',   href: '/risk'                },
  { icon: FileStack,         label: 'Processing',   href: '/processing'          },
  { icon: FileText,          label: 'Reports',      href: '/reports/generate'    },
  { icon: Users2,            label: 'Official Q',   href: '/query/official'      },
] as const

const BOTTOM_ITEMS = [
  { icon: Settings, label: 'Settings', href: '/settings' },
] as const

/* ── Tooltip shown when sidebar is collapsed ── */
function Tooltip({ label, visible }: { label: string; visible: boolean }) {
  return (
    <div
      role="tooltip"
      className={[
        'absolute left-full ml-3 px-2.5 py-1.5 z-50',
        'rounded-md whitespace-nowrap pointer-events-none',
        'bg-coal-surface border border-coal-border text-white text-xs font-medium',
        'transition-all duration-150',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1',
      ].join(' ')}
    >
      {label}
      {/* Left caret */}
      <div
        className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
        style={{ borderRightColor: '#1c3828' }}
        aria-hidden="true"
      />
    </div>
  )
}

/* ── Single nav item ── */
function SidebarNavItem({
  icon: Icon, label, href, collapsed, reduced,
}: {
  icon:     React.ElementType
  label:    string
  href:     string
  collapsed: boolean
  reduced:  boolean
}) {
  const [showTip, setShowTip] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => collapsed && setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <NavLink
        to={href}
        className={({ isActive }) => [
          'flex items-center gap-3 rounded-lg transition-all duration-150 group/nav',
          collapsed
            ? 'px-0 justify-center h-10 w-10 mx-auto'
            : 'px-3 py-2.5 w-full',
          isActive
            ? 'bg-coal-green/10 text-coal-green border border-coal-green/20'
            : 'text-coal-subtle hover:text-coal-text hover:bg-coal-surface border border-transparent',
        ].join(' ')}
      >
        <Icon
          size={18}
          className="flex-shrink-0 transition-transform duration-150 group-hover/nav:scale-105"
        />

        {/* Label — slides/fades when collapsed */}
        {!collapsed && (
          <span
            className="text-sm font-medium whitespace-nowrap overflow-hidden"
            style={reduced
              ? {}
              : {
                  opacity:          collapsed ? 0 : 1,
                  maxWidth:         collapsed ? 0 : '160px',
                  transition:       'max-width 220ms ease, opacity 180ms ease',
                  transitionDelay:  collapsed ? '0ms' : '60ms',
                }
            }
          >
            {label}
          </span>
        )}
      </NavLink>

      {collapsed && <Tooltip label={label} visible={showTip} />}
    </div>
  )
}

/* ── Sidebar ── */
export function Sidebar({ onCollapsedChange }: { onCollapsedChange?: (c: boolean) => void }) {
  const reduced    = useReducedMotion()
  const [collapsed, setCollapsed] = useState(false)

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    onCollapsedChange?.(next)
  }

  const EXPANDED_W  = 240
  const COLLAPSED_W = 60

  return (
    <aside
      className="relative flex flex-col h-full bg-coal-surface border-r border-coal-border flex-shrink-0 z-20"
      style={{
        width:     collapsed ? COLLAPSED_W : EXPANDED_W,
        minWidth:  collapsed ? COLLAPSED_W : EXPANDED_W,
        /* 56.10 — width animates, not position */
        transition: reduced
          ? 'none'
          : 'width 220ms cubic-bezier(0.4,0,0.2,1), min-width 220ms cubic-bezier(0.4,0,0.2,1)',
      }}
      aria-label="Main navigation"
    >
      {/* ── Logo ── */}
      <div
        className={[
          'flex items-center border-b border-coal-border overflow-hidden',
          collapsed ? 'justify-center px-0 h-14' : 'px-4 h-14 gap-2.5',
        ].join(' ')}
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-coal-green flex items-center justify-center">
          <Leaf size={14} className="text-coal-bg" fill="currentColor" />
        </div>

        {/* Logo text fades out on collapse */}
        <div
          className="overflow-hidden"
          style={reduced
            ? { display: collapsed ? 'none' : 'block' }
            : {
                maxWidth:        collapsed ? 0 : 160,
                opacity:         collapsed ? 0 : 1,
                transition:      'max-width 220ms ease, opacity 180ms ease',
                transitionDelay: collapsed ? '0ms' : '60ms',
                whiteSpace:      'nowrap',
              }
          }
        >
          <span className="text-white font-black text-sm tracking-wide">CIP</span>
        </div>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 overflow-hidden px-2">
        {NAV_ITEMS.map(item => (
          <SidebarNavItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            reduced={reduced}
          />
        ))}
      </nav>

      {/* ── Bottom items ── */}
      <div className="py-3 border-t border-coal-border flex flex-col gap-0.5 px-2">
        {BOTTOM_ITEMS.map(item => (
          <SidebarNavItem
            key={item.href}
            {...item}
            collapsed={collapsed}
            reduced={reduced}
          />
        ))}
      </div>

      {/* ── Toggle button ── */}
      <button
        onClick={toggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-[3.5rem] z-30
                   w-6 h-6 rounded-full flex items-center justify-center
                   bg-coal-surface border border-coal-border text-coal-muted
                   hover:text-coal-green hover:border-coal-green/40
                   transition-all duration-200
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coal-green"
      >
        {collapsed
          ? <ChevronRight size={12} />
          : <ChevronLeft  size={12} />
        }
      </button>
    </aside>
  )
}
