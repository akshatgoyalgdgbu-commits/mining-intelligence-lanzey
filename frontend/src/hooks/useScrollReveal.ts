import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

interface ScrollRevealOptions {
  threshold?: number   // 0–1, portion of element visible before firing
  rootMargin?: string  // IntersectionObserver rootMargin
  once?: boolean       // only fire once (default true)
}

/**
 * Returns a ref and a boolean `isVisible`.
 * Attach `ref` to the DOM element you want to observe.
 * `isVisible` becomes true when the element enters the viewport.
 *
 * When reduced-motion is enabled, `isVisible` starts as true
 * so content is never hidden.
 */
export function useScrollReveal<T extends Element>(
  options: ScrollRevealOptions = {}
): [React.RefObject<T>, boolean] {
  const { threshold = 0.12, rootMargin = '0px 0px -40px 0px', once = true } = options
  const reducedMotion = useReducedMotion()
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(reducedMotion)

  useEffect(() => {
    if (reducedMotion) {
      setIsVisible(true)
      return
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) observer.unobserve(el)
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once, reducedMotion])

  return [ref, isVisible]
}
