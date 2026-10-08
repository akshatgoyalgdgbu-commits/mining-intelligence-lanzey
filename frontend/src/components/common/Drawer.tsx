/**
 * 56.17 — Side drawer with fade backdrop + slide-in animation.
 *
 * Backdrop: animate-fade-in (0.4 s, opacity 0→1) + backdrop-blur
 * Drawer:   animate-drawer-in (0.26 s, translateX 100%→0, spring easing)
 * Clicking outside smoothly closes (conditional render).
 *
 * Duration: ~260 ms (spec: 200–300 ms)
 * Reduced-motion: no animation classes applied
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { X }               from 'lucide-react'
import { useReducedMotion } from '@/hooks'

interface DrawerProps {
  open:     boolean
  onClose:  () => void
  title?:   string
  children: ReactNode
  width?:   string
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 'w-96',
}: DrawerProps) {
  const reduced   = useReducedMotion()
  const drawerRef = useRef<HTMLDivElement>(null)

  /* Keyboard: Escape closes */
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  /* Body scroll lock */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      drawerRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    /* Backdrop */
    <div
      className={[
        'fixed inset-0 z-50 flex justify-end',
        'bg-coal-bg/60 backdrop-blur-sm',
        reduced ? '' : 'animate-fade-in',
      ].join(' ')}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Drawer panel — slides in from right */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={[
          'h-full flex flex-col bg-coal-card border-l border-coal-border',
          'shadow-[-24px_0_64px_rgba(0,0,0,0.5)] focus:outline-none',
          width,
          reduced ? '' : 'animate-drawer-in',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-coal-border flex-shrink-0">
          {title && (
            <h2 className="text-white font-semibold text-sm">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-coal-muted hover:text-white transition-colors duration-150
                       p-1 rounded-md hover:bg-coal-surface
                       focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-coal-green"
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 panel-scroll">
          {children}
        </div>
      </div>
    </div>
  )
}
