/**
 * 56.1 / 56.2 / 56.5 — Hero text with staggered fade-up entrance.
 *
 * Timing (matches spec exactly):
 *   0.00s  Eyebrow badge
 *   0.15s  POWERING
 *   0.30s  A SUSTAINABLE  (SUSTAINABLE gets the one-time sweep highlight — 56.2)
 *   0.45s  TOMORROW
 *   0.60s  Description
 *   0.75s  CTA row
 *
 * Movement: ~18 px upward (spec: 10–20 px)
 * No dramatic bounce.
 *
 * CTA micro-interactions (56.5):
 *   Get Started  → hover: -translate-y-0.5, shadow, arrow shifts 4 px right
 *   Login        → hover: border brightens, subtle bg, arrow shifts right
 */

import { ArrowRight, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from '@/hooks'

export function HeroContent() {
  const reduced = useReducedMotion()

  /* Each block is: opacity-0 initially, then animate-fade-up fires
     via the hero-stagger-N delay utilities. */
  const anim = (stagger: number) =>
    reduced
      ? ''
      : `animate-fade-up opacity-0 hero-stagger-${stagger}`

  return (
    <div className="relative z-10 flex flex-col items-start max-w-2xl">

      {/* ── Eyebrow ── */}
      <div
        className={[
          anim(1),
          'inline-flex items-center gap-2 mb-6',
          'px-3 py-1.5 rounded-full',
          'border border-[#00c853]/30 bg-[#00c853]/[0.08]',
          'text-[#00c853] text-xs font-semibold tracking-widest uppercase',
        ].join(' ')}
      >
        {/* Dot pulses once on load, then stays static */}
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#00c853] flex-shrink-0"
          style={reduced ? {} : { animation: 'pulse-once 1s ease-out 1.4s both' }}
        />
        Mining Intelligence Platform
      </div>

      {/* ── Main heading ── */}
      <h1
        className="font-black leading-[0.95] tracking-tight text-white mb-6"
        style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)' }}
      >
        <span className={`block ${anim(2)}`}>
          POWERING
        </span>

        {/* 56.2 — "SUSTAINABLE" gets the one-time light sweep */}
        <span className={`block ${anim(3)}`}>
          A{' '}
          <span
            className="text-sweep"
            aria-label="SUSTAINABLE"
          >
            SUSTAINABLE
          </span>
        </span>

        <span className={`block text-[#00c853] ${anim(4)}`}>
          TOMORROW
        </span>
      </h1>

      {/* ── Subtitle ── */}
      <p
        className={[
          anim(5),
          'text-[#9ab5a0] text-lg md:text-xl leading-relaxed mb-8 max-w-xl',
        ].join(' ')}
      >
        From raw documents to boardroom decisions — LANZEY transforms
        unstructured mining data into actionable intelligence across
        every department.
      </p>

      {/* ── CTA row — 56.5 ── */}
      <div className={`${anim(6)} flex flex-wrap gap-4`}>

        {/* Primary CTA — subtle lift + arrow shifts right on hover */}
        <Link
          to="/dashboard"
          className="group/btn btn-primary text-base px-7 py-3.5"
        >
          Get Started
          <ArrowRight
            size={18}
            className="arrow-shift flex-shrink-0"
            aria-hidden="true"
          />
        </Link>

        {/* Secondary CTA — border brightens, subtle bg, arrow shifts right */}
        <Link
          to="/login"
          className="group/btn btn-secondary text-base px-7 py-3.5"
        >
          Login
          <ChevronRight
            size={18}
            className="arrow-shift flex-shrink-0"
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* ── Trust stats ── */}
      <div
        className={`mt-10 flex gap-8 ${reduced ? '' : 'animate-fade-up opacity-0'}`}
        style={reduced ? {} : { animationDelay: '900ms', animationFillMode: 'both' }}
      >
        {[
          { label: 'Mine Sites',           value: '40+' },
          { label: 'Documents Processed',  value: '2M+' },
          { label: 'Faster Decisions',     value: '3×'  },
        ].map(stat => (
          <div key={stat.label} className="flex flex-col">
            <span className="text-2xl font-bold text-white">{stat.value}</span>
            <span className="text-xs text-[#6b7280]">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
