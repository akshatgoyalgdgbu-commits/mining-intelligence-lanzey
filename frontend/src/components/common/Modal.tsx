/**
 * 56.17 — Modal with fade backdrop + scale/fade panel animation.
 *
 * Backdrop: animate-fade-in (0.4 s, opacity 0→1) + backdrop-blur
 * Panel:    animate-modal-in (0.22 s, scale 0.95→1 + translateY -10→0)
 * Close:    clicking outside or Escape — smooth because panel unmounts
 *           and backdrop fades with CSS
 *
 * Duration: ~220 ms (spec: 200–300 ms)
 * Reduced-motion: no animation classes applied
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { X }               from 'lucide-react'
import { useReducedMotion } from '@/hooks'

interface ModalProps {
  open:      boolean
  onClose:   () => void
  title?:    string
  children:  ReactNode
  maxWidth?: string
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  const reduced  = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

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
      panelRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    /* Backdrop — fade-in + blur */
    <div
      className={[
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-coal-bg/70 backdrop-blur-sm',
        reduced ? '' : 'animate-fade-in',
      ].join(' ')}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Panel — scale-fade in */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          'relative w-full rounded-2xl bg-coal-card border border-coal-border',
          'shadow-[0_24px_64px_rgba(0,0,0,0.6)] focus:outline-none',
          maxWidth,
          reduced ? '' : 'animate-modal-in',
        ].join(' ')}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-coal-border">
            <h2 className="text-white font-semibold text-base">{title}</h2>
            <button
              onClick={onClose}
              className="text-coal-muted hover:text-white transition-colors duration-150
                         p-1 rounded-md hover:bg-coal-surface
                         focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-coal-green"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
