import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

/**
 * Reveals `count` items sequentially with a `staggerMs` delay between each.
 * Starts when `triggered` is true.
 * Returns an array of booleans: `visible[i]` is true when item i should be shown.
 */
export function useStaggeredReveal(
  count: number,
  staggerMs = 100,
  triggered = true
): boolean[] {
  const reducedMotion = useReducedMotion()
  const [visible, setVisible] = useState<boolean[]>(
    () => Array(count).fill(reducedMotion || !triggered)
  )
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!triggered) return

    if (reducedMotion) {
      setVisible(Array(count).fill(true))
      return
    }

    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    const newVisible = Array(count).fill(false)
    setVisible([...newVisible])

    for (let i = 0; i < count; i++) {
      const t = setTimeout(() => {
        setVisible(prev => {
          const next = [...prev]
          next[i] = true
          return next
        })
      }, i * staggerMs)
      timersRef.current.push(t)
    }

    return () => timersRef.current.forEach(clearTimeout)
  }, [count, staggerMs, triggered, reducedMotion])

  return visible
}
