/**
 * 56.19 — Button with all interactive states.
 *
 * States:
 *   Default  — normal enterprise styling
 *   Hover    — subtle accent transition, -translate-y-0.5 (micro-lift)
 *   Active   — translate-y-0, scale-[0.97] (compressed feel)
 *   Loading  — Loader2 spinner, cursor-wait, aria-busy
 *   Success  — checkmark scale-in, replaces content briefly
 *   Disabled — opacity-40, cursor-not-allowed, no interaction
 *
 * Arrow shift: right icon gets .arrow-shift so CSS group-hover moves it 4 px.
 * All durations: 150–200 ms (micro-interaction spec).
 */

import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Check, Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   Variant
  size?:      Size
  loading?:   boolean
  success?:   boolean
  leftIcon?:  ReactNode
  rightIcon?: ReactNode
  children:   ReactNode
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger: [
    'relative inline-flex items-center gap-2 px-6 py-3 rounded-lg',
    'font-semibold text-sm',
    'bg-red-500/10 text-red-400 border border-red-500/20',
    'transition-all duration-200',
    'hover:bg-red-500/20 hover:border-red-500/40 hover:-translate-y-0.5',
    'active:translate-y-0 active:scale-[0.97]',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
  ].join(' '),
}

const SIZE_OVERRIDE: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

export function Button({
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  success   = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      {...rest}
      disabled={isDisabled}
      aria-busy={loading}
      aria-disabled={isDisabled}
      className={[
        'group/btn',               /* enables .arrow-shift via CSS group */
        VARIANT_CLASS[variant],
        SIZE_OVERRIDE[size],
        loading ? 'cursor-wait' : '',
        className,
      ].join(' ')}
    >
      {/* Loading spinner */}
      {loading && (
        <Loader2
          size={14}
          className="animate-spin flex-shrink-0"
          aria-hidden="true"
        />
      )}

      {/* Success check — scale-in once */}
      {!loading && success && (
        <span className="animate-check-appear flex-shrink-0" aria-hidden="true">
          <Check size={14} className="text-coal-green" />
        </span>
      )}

      {/* Left icon (only when not loading/success) */}
      {!loading && !success && leftIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {leftIcon}
        </span>
      )}

      <span>{children}</span>

      {/* Right icon — arrow-shift moves it 4 px on group-hover (56.5) */}
      {!loading && !success && rightIcon && (
        <span className="flex-shrink-0 arrow-shift" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  )
}
