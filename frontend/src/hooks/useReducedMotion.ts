import { useEffect, useState } from 'react'

/**
 * 56.21 — Detects the user's prefers-reduced-motion preference.
 *
 * Returns `true` when animations should be disabled or minimised.
 *
 * Behaviour:
 *   - Reads the media query synchronously on first render (avoids flash)
 *   - Subscribes to changes so toggling the OS setting applies live
 *   - SSR-safe: defaults to `false` when `window` is unavailable
 *
 * Usage:
 *   const reduced = useReducedMotion()
 *   // reduced === true → disable animation, skip transforms, jump to end values
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mq      = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)

    /* Modern browsers */
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }

    /* Legacy fallback */
    mq.addListener(handler)
    return () => mq.removeListener(handler)
  }, [])

  return reduced
}
