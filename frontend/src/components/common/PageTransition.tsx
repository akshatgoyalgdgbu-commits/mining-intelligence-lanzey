/**
 * 56.9 — Page transition wrapper.
 *
 * On every route change the key prop changes, which unmounts/remounts
 * the subtree and re-triggers animate-page-enter.
 *
 * Effect:
 *   - Fade in (opacity 0 → 1)
 *   - Subtle upward movement (6 px)
 *   - Duration: 380 ms, ease-out
 *   - Pages feel connected, not jarring
 *
 * Reduced motion: wrapper renders with no animation class so content
 * appears instantly — fully usable without motion.
 */

import { type ReactNode } from 'react'
import { useLocation }    from 'react-router-dom'
import { useReducedMotion } from '@/hooks'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const reduced  = useReducedMotion()

  return (
    <div
      key={location.pathname}
      className={reduced ? '' : 'animate-page-enter'}
      style={{ animationFillMode: 'both' }}
    >
      {children}
    </div>
  )
}
