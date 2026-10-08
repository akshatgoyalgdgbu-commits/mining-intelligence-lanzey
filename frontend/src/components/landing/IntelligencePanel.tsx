/**
 * 56.3 — "FROM DOCUMENTS TO DECISIONS" panel.
 *   - Animates in from the right on scroll entry
 *   - Pipeline items appear sequentially (staggered fade + slide)
 *   - Each icon gets a small scale-in
 *
 * 56.4 — Moving dot flows vertically through the pipeline track,
 *   representing:  Information → Intelligence → Decision
 *   Slow (2.8 s cycle), elegant, never looks like a spinner.
 */

import { useEffect, useRef, useState } from 'react'
import {
  Upload,
  Brain,
  Lightbulb,
  FileText,
  TrendingUp,
  ArrowDown,
} from 'lucide-react'
import { useScrollReveal, useStaggeredReveal, useReducedMotion } from '@/hooks'

const PIPELINE = [
  {
    icon: Upload,
    label: 'Upload Documents',
    desc: 'Drill reports, assay logs, safety records',
    color: '#00c853',
  },
  {
    icon: Brain,
    label: 'AI Extracts Information',
    desc: 'NLP parses structure from raw text',
    color: '#33d46e',
  },
  {
    icon: Lightbulb,
    label: 'Generate Insights',
    desc: 'Patterns surface across datasets',
    color: '#6ee7b7',
  },
  {
    icon: FileText,
    label: 'Automated Reports',
    desc: 'Scheduled intelligence delivered',
    color: '#a7f3d0',
  },
  {
    icon: TrendingUp,
    label: 'Smarter Mining Decisions',
    desc: 'From data to decisive action',
    color: '#00c853',
  },
] as const

/* ─── 56.4 — Animated dot that flows top → bottom of the pipeline ─── */
function FlowDot({ active }: { active: boolean }) {
  /* rAF-based position: 0–100 %, resets seamlessly */
  const [pos, setPos] = useState(0)
  const rafRef   = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const DURATION = 2800 // ms per full pass

  useEffect(() => {
    if (!active) return

    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const elapsed = (ts - startRef.current) % DURATION
      setPos((elapsed / DURATION) * 100)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [active])

  if (!active) return null

  /* Fade out near the bottom so it doesn't hard-cut */
  const opacity = pos > 88 ? Math.max(0, 1 - (pos - 88) / 12) : pos < 8 ? pos / 8 : 1

  return (
    <div
      aria-hidden="true"
      className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full pointer-events-none"
      style={{
        top:       `${pos}%`,
        opacity,
        background: '#00c853',
        boxShadow: '0 0 8px 2px rgba(0,200,83,0.55)',
        transition: 'top 40ms linear',
        willChange: 'top',
      }}
    />
  )
}

export function IntelligencePanel() {
  const reduced = useReducedMotion()
  const [panelRef, panelVisible] = useScrollReveal<HTMLDivElement>({ threshold: 0.08 })
  const itemsVisible = useStaggeredReveal(PIPELINE.length, 110, panelVisible)

  return (
    <div
      ref={panelRef}
      className={[
        'relative bg-lanzey-card border border-lanzey-border rounded-2xl p-6 md:p-8',
        /* 56.3 — panel slides in from right when it enters viewport */
        reduced ? '' : 'transition-all duration-[500ms] cubic-bezier(0.16,1,0.3,1)',
        !reduced && !panelVisible ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0',
      ].join(' ')}
      style={{ willChange: reduced ? 'auto' : 'transform, opacity' }}
    >
      {/* Header */}
      <div className="mb-8">
        <p className="text-lanzey-green text-xs font-semibold tracking-widest uppercase mb-1">
          How It Works
        </p>
        <h3 className="text-white text-xl md:text-2xl font-bold leading-tight">
          From Documents
          <br />
          <span className="text-lanzey-green">to Decisions</span>
        </h3>
      </div>

      {/* Pipeline — relative container for the 56.4 dot track */}
      <div className="relative">

        {/* Vertical connector track */}
        <div
          className="absolute left-5 top-5 bottom-5 w-px"
          style={{
            background:
              'linear-gradient(to bottom, #1e3028, rgba(0,200,83,0.35), #1e3028)',
          }}
          aria-hidden="true"
        />

        {/* 56.4 — Flowing dot rides the track */}
        <div
          className="absolute left-5 top-5 bottom-5 w-px overflow-hidden"
          aria-hidden="true"
        >
          <FlowDot active={panelVisible && !reduced} />
        </div>

        {/* Pipeline items */}
        <div className="space-y-1">
          {PIPELINE.map((step, i) => {
            const Icon    = step.icon
            const visible = itemsVisible[i]

            return (
              <div
                key={step.label}
                className={[
                  'relative flex items-start gap-4 p-3 rounded-xl',
                  'group/item hover:bg-lanzey-green/[0.04]',
                  /* 56.3 — staggered slide-in */
                  reduced ? '' : 'transition-all duration-[400ms]',
                  !reduced && !visible
                    ? 'opacity-0 translate-x-4'
                    : 'opacity-100 translate-x-0',
                ].join(' ')}
                style={reduced ? {} : { transitionDelay: `${i * 60}ms` }}
              >
                {/* Icon — small scale-in on entry, scale-110 on hover */}
                <div
                  className={[
                    'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center z-10',
                    'bg-lanzey-surface border border-lanzey-border',
                    'transition-transform duration-200 group-hover/item:scale-110',
                    /* Scale-in keyframe fires when item becomes visible */
                    visible && !reduced ? 'animate-scale-in' : '',
                  ].join(' ')}
                  style={{
                    animationDelay: reduced ? '0ms' : `${i * 120 + 80}ms`,
                    boxShadow:      visible ? `0 0 0 1px ${step.color}22` : 'none',
                  }}
                >
                  <Icon size={18} style={{ color: step.color }} />
                </div>

                {/* Text */}
                <div className="pt-1 min-w-0">
                  <p className="text-white text-sm font-semibold leading-tight">
                    {step.label}
                  </p>
                  <p className="text-lanzey-muted text-xs mt-0.5 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Connector arrow (not on last item) */}
                {i < PIPELINE.length - 1 && (
                  <ArrowDown
                    size={12}
                    className="absolute left-[1.2rem] bottom-[-0.6rem] text-lanzey-border z-10"
                    aria-hidden="true"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer — live processing badge */}
      <div className="mt-6 pt-5 border-t border-lanzey-border">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full bg-lanzey-green"
            style={reduced ? {} : { animation: 'status-pulse 2.4s ease-in-out infinite' }}
          />
          <span className="text-xs text-lanzey-muted">
            Processing active across{' '}
            <span className="text-lanzey-green font-semibold">40 mine sites</span>
          </span>
        </div>
      </div>
    </div>
  )
}
