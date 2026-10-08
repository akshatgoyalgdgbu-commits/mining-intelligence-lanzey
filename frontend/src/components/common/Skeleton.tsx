/**
 * 56.20 — Skeleton loaders with extremely subtle shimmer.
 *
 * Rules:
 *   - Shimmer: 1.6 s linear, from dark → slightly lighter → dark
 *   - Never blank — skeleton fills the exact layout of the real component
 *   - Skeleton shapes match the real component structure
 *   - Reduced-motion: shimmer stops, static bg renders instead
 */

import type { CSSProperties } from 'react'

interface SkeletonProps {
  className?: string
  style?:     CSSProperties
  rounded?:   boolean
  circle?:    boolean
  width?:     string | number
  height?:    string | number
}

/* Base skeleton bar */
export function Skeleton({
  className = '',
  style,
  rounded,
  circle,
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={[
        'skeleton',
        rounded || circle ? 'rounded-full' : 'rounded-md',
        className,
      ].join(' ')}
      aria-hidden="true"
      style={{
        width:        width  ?? undefined,
        height:       height ?? undefined,
        borderRadius: circle ? '50%' : undefined,
        ...style,
      }}
    />
  )
}

/* KPI card skeleton — matches KpiCard layout exactly */
export function KpiCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="kpi-card flex flex-col gap-3 animate-fade-in opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
      aria-busy="true"
      aria-label="Loading KPI"
    >
      <Skeleton width={80}  height={12} />
      <Skeleton width={120} height={32} />
      <Skeleton width={100} height={12} />
    </div>
  )
}

/* Table row skeleton */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr aria-busy="true" aria-label="Loading row">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton height={14} width={`${60 + (i * 7) % 35}%`} />
        </td>
      ))}
    </tr>
  )
}

/* Generic card skeleton */
export function CardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="bg-coal-card border border-coal-border rounded-xl p-6 flex flex-col gap-3 animate-fade-in opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <Skeleton circle width={40} height={40} />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton height={14} width="60%" />
          <Skeleton height={11} width="40%" />
        </div>
      </div>
      <Skeleton height={12} />
      <Skeleton height={12} width="85%" />
      <Skeleton height={12} width="70%" />
    </div>
  )
}

/* Pipeline stage skeleton (DocumentProcessing) */
export function StageSkeleton() {
  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl border border-coal-border/50 animate-fade-in"
      aria-busy="true"
    >
      <Skeleton circle width={36} height={36} />
      <div className="flex-1 flex flex-col gap-2 pt-1">
        <Skeleton height={14} width="40%" />
        <Skeleton height={11} width="70%" />
      </div>
    </div>
  )
}
