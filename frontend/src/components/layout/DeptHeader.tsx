/**
 * DeptHeader — reusable department page header with badge + actions.
 */

import type { ReactNode } from 'react'

interface DeptHeaderProps {
  icon:       ReactNode
  color:      string
  dept:       string
  title:      string
  subtitle?:  string
  actions?:   ReactNode
}

export function DeptHeader({ icon, color, dept, title, subtitle, actions }: DeptHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 animate-fade-up">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-md uppercase"
              style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}
            >
              {dept}
            </span>
          </div>
          <h1 className="text-white text-xl font-bold leading-tight">{title}</h1>
          {subtitle && <p className="text-coal-muted text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
