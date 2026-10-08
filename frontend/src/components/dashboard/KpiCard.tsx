/**
 * 56.11 — KPI card with count-up animation on first scroll entry.
 *
 * What animates:
 *   - Card fades + rises (translate-y-5 → 0) when it enters viewport
 *   - Number counts up from 0 → target over 1100 ms (cubic ease-out)
 *   - Trend arrow + label fade-up 300 ms after card appears
 *
 * Rules:
 *   - Count-up fires ONCE when the element becomes visible
 *   - Never re-animates on re-render
 *   - Reduced-motion: jumps straight to final value, no transform
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useScrollReveal, useCountUp, useReducedMotion } from '@/hooks'

type Trend = 'up' | 'down' | 'flat'

interface KpiCardProps {
  label:       string
  value:       number
  prefix?:     string
  suffix?:     string
  decimals?:   number
  trend?:      Trend
  trendValue?: string
  trendLabel?: string
  delay?:      number   // stagger delay for the card entrance (ms)
}

const TREND_ICON: Record<Trend, React.ElementType> = {
  up:   TrendingUp,
  down: TrendingDown,
  flat: Minus,
}
const TREND_COLOR: Record<Trend, string> = {
  up:   'text-coal-green',
  down: 'text-red-400',
  flat: 'text-coal-muted',
}

export function KpiCard({
  label,
  value,
  prefix   = '',
  suffix   = '',
  decimals = 0,
  trend,
  trendValue,
  trendLabel,
  delay    = 0,
}: KpiCardProps) {
  const reduced   = useReducedMotion()
  const [ref, visible] = useScrollReveal<HTMLDivElement>({ threshold: 0.15 })

  /* 56.11 — count-up starts when card is visible */
  const displayed = useCountUp({
    end:      value,
    prefix,
    suffix,
    decimals,
    enabled:  visible,
    duration: 1100,
  })

  const TrendIcon = trend ? TREND_ICON[trend] : null

  return (
    <div
      ref={ref}
      className={[
        'kpi-card flex flex-col gap-3',
        reduced ? '' : 'transition-all duration-500',
        !reduced && !visible ? 'opacity-0 translate-y-5' : 'opacity-100 translate-y-0',
      ].join(' ')}
      style={reduced ? {} : { transitionDelay: `${delay}ms` }}
    >
      {/* Label */}
      <p className="text-coal-muted text-xs font-medium uppercase tracking-widest">
        {label}
      </p>

      {/* Animated value */}
      <p className="text-white text-3xl font-black tabular-nums leading-none">
        {displayed}
      </p>

      {/* Trend row — fades up 300 ms after card */}
      {trend && TrendIcon && (
        <div
          className={[
            'flex items-center gap-1.5',
            reduced ? '' : 'transition-all duration-400',
            !reduced && !visible
              ? 'opacity-0 translate-y-2'
              : 'opacity-100 translate-y-0',
          ].join(' ')}
          style={reduced ? {} : { transitionDelay: `${delay + 300}ms` }}
        >
          <TrendIcon size={14} className={TREND_COLOR[trend]} />
          {trendValue && (
            <span className={`text-xs font-semibold ${TREND_COLOR[trend]}`}>
              {trendValue}
            </span>
          )}
          {trendLabel && (
            <span className="text-coal-muted text-xs">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
