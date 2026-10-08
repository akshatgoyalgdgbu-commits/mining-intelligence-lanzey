import { useReducedMotion } from '@/hooks'

/**
 * 56.1 — Hero background with subtle cinematic zoom + gentle horizontal drift.
 *
 * Animation:
 *   - Scale 1.08 → 1.01 over 9 s  (very slow push-in)
 *   - Horizontal drift 0 → -6 px  (barely perceptible)
 *   - Opacity 0.85 → 1 in first 15% of the animation (gentle reveal)
 *
 * The background MUST NOT feel like a moving wallpaper.
 * willChange is set only while animating so layout is not affected at rest.
 */
export function HeroBackground() {
  const reduced = useReducedMotion()

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">

      {/* ── Image / gradient layer ── */}
      <div
        className={[
          'absolute inset-0 bg-center bg-cover',
          reduced ? '' : 'animate-bg-zoom',
        ].join(' ')}
        style={{
          /* Primary: local image saved to public/images/mining-bg.jpg */
          backgroundImage: `url('/images/mining-bg.png')`,
          willChange: reduced ? 'auto' : 'transform',
        }}
      />

      {/* ── Primary dark overlay — text readability ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              to bottom,
              rgba(8,14,11,0.30) 0%,
              rgba(8,14,11,0.50) 50%,
              rgba(8,14,11,0.88) 90%,
              rgba(8,14,11,1.00) 100%
            )
          `,
        }}
      />

      {/* ── Left-side vignette — keeps left text legible ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to right, rgba(8,14,11,0.65) 0%, transparent 55%)`,
        }}
      />

      {/* ── Very faint brand-green tint — LANZEY presence ── */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 25%, #00c853, transparent)`,
        }}
      />
    </div>
  )
}
