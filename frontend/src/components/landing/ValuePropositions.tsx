/**
 * 56.6 — Value proposition section.
 *
 * On scroll entry:
 *   - Section header fades + rises
 *   - Cards appear with staggered fade-up (not bounce)
 *   - Icons scale-in with stagger offset
 *
 * On hover:
 *   - Icon lifts upward 4 px
 *   - Title transitions to green
 *   - Subtle green accent line appears at card bottom
 *   - Card border brightens — NO bounce, NO scale
 */

import { ShieldCheck, Leaf, Zap, Users } from 'lucide-react'
import { useScrollReveal, useStaggeredReveal, useReducedMotion } from '@/hooks'

const VALUES = [
  {
    icon:   ShieldCheck,
    title:  'Safer Operations',
    desc:   'Real-time hazard detection and incident tracking keep workers protected with data-driven safety protocols.',
    accent: '#00c853',
  },
  {
    icon:   Leaf,
    title:  'Sustainable Mining',
    desc:   'Environmental impact dashboards and ESG reporting meet compliance requirements before they become issues.',
    accent: '#33d46e',
  },
  {
    icon:   Zap,
    title:  'Efficient Resource Use',
    desc:   'AI-optimised scheduling and predictive maintenance reduce waste across every shift and asset.',
    accent: '#6ee7b7',
  },
  {
    icon:   Users,
    title:  'Collaborative Governance',
    desc:   'Shared intelligence across departments eliminates information silos and accelerates aligned decisions.',
    accent: '#a7f3d0',
  },
] as const

export function ValuePropositions() {
  const reduced = useReducedMotion()
  const [sectionRef, sectionVisible] = useScrollReveal<HTMLDivElement>({ threshold: 0.08 })
  const itemsVisible = useStaggeredReveal(VALUES.length, 90, sectionVisible)

  return (
    <section ref={sectionRef} className="py-24 px-6 md:px-12 max-w-7xl mx-auto">

      {/* Section header */}
      <div
        className={[
          'text-center mb-16',
          reduced ? '' : 'transition-all duration-500',
          !reduced && !sectionVisible ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0',
        ].join(' ')}
      >
        <p className="text-lanzey-green text-xs font-semibold tracking-widest uppercase mb-3">
          Why LANZEY
        </p>
        <h2 className="text-white text-3xl md:text-4xl font-bold">
          Built for mining.{' '}
          <span className="text-lanzey-green">Designed for decisions.</span>
        </h2>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {VALUES.map((v, i) => {
          const Icon    = v.icon
          const visible = itemsVisible[i]

          return (
            <div
              key={v.title}
              className={[
                'group relative flex flex-col p-6 rounded-xl cursor-default',
                'bg-lanzey-card border border-lanzey-border',
                /* 56.6 hover — border brightens, bg tints */
                'transition-all duration-200',
                'hover:border-lanzey-green/30 hover:bg-lanzey-green/[0.03]',
                /* Scroll reveal */
                reduced ? '' : 'transition-all duration-500',
                !reduced && !visible ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0',
              ].join(' ')}
              style={reduced ? {} : { transitionDelay: `${i * 80}ms` }}
            >
              {/* Icon — scale-in on entry, lifts on hover (56.6) */}
              <div
                className={[
                  'w-11 h-11 rounded-lg flex items-center justify-center mb-4',
                  'border border-lanzey-border bg-lanzey-surface',
                  /* 56.6 — icon lifts 4px on card hover */
                  'transition-transform duration-200 group-hover:-translate-y-1',
                  visible && !reduced ? 'animate-scale-in' : '',
                ].join(' ')}
                style={{
                  animationDelay: reduced ? '0ms' : `${i * 100 + 100}ms`,
                  boxShadow:      `0 0 0 1px ${v.accent}18`,
                }}
              >
                <Icon size={20} style={{ color: v.accent }} />
              </div>

              {/* Title — accent shift on hover */}
              <h3 className="text-white font-semibold text-base mb-2 transition-colors duration-200 group-hover:text-lanzey-green">
                {v.title}
              </h3>

              <p className="text-lanzey-muted text-sm leading-relaxed">
                {v.desc}
              </p>

              {/* Bottom accent line — appears on hover, 200 ms */}
              <div
                className="absolute bottom-0 left-6 right-6 h-px rounded-full
                           bg-lanzey-green/0 group-hover:bg-lanzey-green/30
                           transition-colors duration-200"
                aria-hidden="true"
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
