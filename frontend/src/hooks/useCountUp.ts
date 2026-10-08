import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

interface CountUpOptions {
  start?: number
  end: number
  duration?: number  // ms
  decimals?: number
  prefix?: string
  suffix?: string
  enabled?: boolean  // start counting when this becomes true
}

/**
 * Animates a number from `start` to `end` over `duration` ms.
 * Returns a formatted string ready for display.
 * Respects prefers-reduced-motion — jumps straight to end value.
 */
export function useCountUp({
  start = 0,
  end,
  duration = 1200,
  decimals = 0,
  prefix = '',
  suffix = '',
  enabled = true,
}: CountUpOptions): string {
  const reducedMotion = useReducedMotion()
  const [value, setValue] = useState(reducedMotion ? end : start)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (reducedMotion) {
      setValue(end)
      return
    }

    const startTime = performance.now()
    const range = end - start

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(start + range * eased)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [start, end, duration, enabled, reducedMotion])

  const formatted = value.toFixed(decimals)
  // Add thousand separators
  const [intPart, decPart] = formatted.split('.')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const display = decimals > 0 ? `${withCommas}.${decPart}` : withCommas

  return `${prefix}${display}${suffix}`
}
