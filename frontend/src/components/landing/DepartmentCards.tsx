/**
 * 56.7 — Department cards with polished hover interactions.
 *
 * On hover (250 ms):
 *   - Card lifts 4 px  (translate-y-1)
 *   - Border brightens to green/40
 *   - Shadow appears with green tint
 *   - Arrow shifts 4 px right
 *   - Icon scales 110 %
 *   - Title shifts to green
 *   - Description stays stable (no animation)
 *
 * On scroll entry:
 *   - Cards reveal with staggered fade-up (not bounce)
 */

import { ArrowRight, Beaker, HardHat, BarChart3, Leaf, Shield, Users2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useScrollReveal, useStaggeredReveal, useReducedMotion } from '@/hooks'

const DEPARTMENTS = [
  {
    icon:  Beaker,
    code:  'CIL',
    name:  'CIL Operations',
    desc:  'Carbon-in-leach process monitoring and optimisation.',
    href:  '/departments/cil',
    color: '#00c853',
  },
  {
    icon:  HardHat,
    code:  'OPS',
    name:  'Mine Operations',
    desc:  'Production tracking, shift reporting and equipment status.',
    href:  '/departments/operations',
    color: '#33d46e',
  },
  {
    icon:  BarChart3,
    code:  'GEO',
    name:  'Geology & Assay',
    desc:  'Drill data, grade control and resource modelling.',
    href:  '/departments/geology',
    color: '#6ee7b7',
  },
  {
    icon:  Leaf,
    code:  'ENV',
    name:  'Environment',
    desc:  'ESG compliance, water and emissions monitoring.',
    href:  '/departments/environment',
    color: '#86efac',
  },
  {
    icon:  Shield,
    code:  'SHE',
    name:  'Safety & Health',
    desc:  'Incident reporting, risk tracking and safety culture.',
    href:  '/departments/safety',
    color: '#4ade80',
  },
  {
    icon:  Users2,
    code:  'GOV',
    name:  'Governance',
    desc:  'Regulatory submissions, audits and board reporting.',
    href:  '/departments/governance',
    color: '#a7f3d0',
  },
] as const

export function DepartmentCards() {
  const reduced = useReducedMotion()
  const [sectionRef, sectionVisible] = useScrollReveal<HTMLDivElement>({ threshold: 0.06 })
  const cardsVisible = useStaggeredReveal(DEPARTMENTS.length, 70, sectionVisible)

  return (
    <section ref={sectionRef} className="py-20 px-6 md:px-12 max-w-7xl mx-auto">

      {/* Header */}
      <div
        className={[
          'mb-12',
          reduced ? '' : 'transition-all duration-500',
          !reduced && !sectionVisible ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0',
        ].join(' ')}
      >
        <p className="text-lanzey-green text-xs font-semibold tracking-widest uppercase mb-3">
          Departments
        </p>
        <h2 className="text-white text-3xl md:text-4xl font-bold">
          Intelligence for every team
        </h2>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEPARTMENTS.map((dept, i) => {
          const Icon    = dept.icon
          const visible = cardsVisible[i]

          return (
            <Link
              key={dept.code}
              to={dept.href}
              className={[
                'group relative flex flex-col p-6 rounded-xl',
                'bg-lanzey-card border border-lanzey-border',
                /* 56.7 — card lifts 4px, border/shadow brighten */
                'transition-all duration-[250ms]',
                'hover:-translate-y-1 hover:border-lanzey-green/40',
                'hover:shadow-[0_8px_32px_rgba(0,200,83,0.08)]',
                /* Scroll reveal */
                reduced ? '' : 'transition-all duration-500',
                !reduced && !visible ? 'opacity-0 translate-y-5' : 'opacity-100 translate-y-0',
              ].join(' ')}
              style={reduced ? {} : { transitionDelay: `${i * 55}ms` }}
            >
              {/* Icon + code badge */}
              <div className="flex items-center justify-between mb-4">
                <div
                  className={[
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    'bg-lanzey-surface border border-lanzey-border',
                    /* 56.7 — icon scales 110% on card hover */
                    'transition-transform duration-[250ms] group-hover:scale-110',
                  ].join(' ')}
                  style={{ boxShadow: `0 0 0 1px ${dept.color}18` }}
                >
                  <Icon size={18} style={{ color: dept.color }} />
                </div>

                <span
                  className="text-xs font-bold tracking-widest px-2 py-0.5 rounded-md"
                  style={{
                    color:      dept.color,
                    background: `${dept.color}12`,
                    border:     `1px solid ${dept.color}20`,
                  }}
                >
                  {dept.code}
                </span>
              </div>

              {/* Title — green on hover */}
              <h3 className="text-white font-semibold text-base mb-1.5 group-hover:text-lanzey-green transition-colors duration-200">
                {dept.name}
              </h3>

              {/* Description — stable, no animation */}
              <p className="text-lanzey-muted text-sm leading-relaxed flex-1">
                {dept.desc}
              </p>

              {/* Arrow row — shifts right 4px on hover (56.7) */}
              <div className="mt-4 flex items-center gap-1 text-lanzey-muted group-hover:text-lanzey-green transition-colors duration-200">
                <span className="text-xs font-medium">Explore</span>
                <ArrowRight
                  size={14}
                  className="transition-transform duration-[250ms] group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
