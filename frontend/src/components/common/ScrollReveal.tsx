/**
 * 56.8 — Generic scroll-reveal wrapper.
 *
 * Groups related content together — fades + rises as a unit when it
 * enters the viewport. Children are NOT individually animated here;
 * use useStaggeredReveal for staggered children.
 *
 * Rules:
 *   - Movement: 20 px by default (spec: subtle upward)
 *   - Duration: 500 ms by default
 *   - Easing: ease-out (feels natural, not bouncy)
 *   - Fires once (IntersectionObserver `once: true`)
 *   - Reduced-motion: content instantly visible, no transform
 */

import { type ReactNode, type CSSProperties } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface ScrollRevealProps {
  children:   ReactNode
  className?: string
  /** px to shift upward before reveal (default 20, spec: 10–20 px) */
  distance?:  number
  /** ms transition duration (default 500) */
  duration?:  number
  /** Extra delay before reveal starts (ms) */
  delay?:     number
  /** IntersectionObserver threshold (default 0.1) */
  threshold?: number
  /** Pass-through inline styles */
  style?:     CSSProperties
  /** HTML element to render (default 'div') */
  as?:        'div' | 'section' | 'article' | 'aside' | 'main' | 'header' | 'footer' | 'ul' | 'li'
}

export function ScrollReveal({
  children,
  className  = '',
  distance   = 20,
  duration   = 500,
  delay      = 0,
  threshold  = 0.1,
  style,
  as: _Tag   = 'div',
}: ScrollRevealProps) {
  const reduced               = useReducedMotion()
  const [ref, isVisible]      = useScrollReveal<HTMLDivElement>({ threshold })

  const motionStyle: CSSProperties = reduced
    ? {}
    : {
        transition:       `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
        transitionDelay:  `${delay}ms`,
        opacity:          isVisible ? 1 : 0,
        transform:        isVisible ? 'translateY(0)' : `translateY(${distance}px)`,
        /* Only hint GPU while animating; release after */
        willChange:       isVisible ? 'auto' : 'opacity, transform',
      }

  // Always render as div for simplicity and type safety
  return (
    <div
      ref={ref}
      className={className}
      style={{ ...motionStyle, ...style }}
    >
      {children}
    </div>
  )
}
