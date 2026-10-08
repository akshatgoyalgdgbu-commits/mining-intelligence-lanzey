/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── Primary palette (coal-* used in components) ── */
        coal: {
          bg:           '#0b1a14',
          surface:      '#0f2018',
          card:         '#122318',
          card2:        '#0e1f16',
          border:       '#1c3828',
          green:        '#00c853',
          'green-dim':  '#009e42',
          'green-glow': '#33d46e',
          teal:         '#00897b',
          muted:        '#6b7280',
          text:         '#e8f0eb',
          subtle:       '#9ab5a0',
          nav:          'rgba(10,22,15,0.95)',
        },
        /* ── lanzey-* aliases (pages/new components use these) ── */
        lanzey: {
          bg:           '#0b1a14',
          surface:      '#0f2018',
          card:         '#122318',
          card2:        '#0e1f16',
          border:       '#1c3828',
          green:        '#00c853',
          'green-dim':  '#009e42',
          'green-glow': '#33d46e',
          teal:         '#00897b',
          muted:        '#6b7280',
          text:         '#e8f0eb',
          subtle:       '#9ab5a0',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      transitionDuration: {
        '220': '220ms',
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },

      /* ── Keyframes ── */
      keyframes: {
        /* Entrance */
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        /* 56.1 — Hero background cinematic zoom + drift */
        'bg-zoom': {
          '0%':   { transform: 'scale(1.08) translateX(0px)',  opacity: '0.85' },
          '15%':  { opacity: '1' },
          '100%': { transform: 'scale(1.01) translateX(-6px)', opacity: '1' },
        },
        /* 56.2 — SUSTAINABLE sweep */
        'sweep': {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '300% center' },
        },
        /* 56.3 — Panel slides in from right */
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        /* Panel slides in from left */
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-32px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        /* 56.3 / 56.6 — Icon scale-in */
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.82)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        /* 56.15 — AI badge one-time pulse */
        'pulse-once': {
          '0%':   { opacity: '0.5', boxShadow: '0 0 0 0 rgba(0,200,83,0.45)' },
          '50%':  { opacity: '1',   boxShadow: '0 0 0 7px rgba(0,200,83,0)' },
          '100%': { opacity: '1',   boxShadow: '0 0 0 0 rgba(0,200,83,0)' },
        },
        /* 56.20 — Skeleton shimmer */
        'shimmer': {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition:  '400px 0' },
        },
        /* 56.4 — Data-flow dot */
        'flow-down': {
          '0%':   { transform: 'translateY(0)',    opacity: '0' },
          '8%':   { opacity: '1' },
          '88%':  { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        /* 56.17 — Drawer slide */
        'drawer-in': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        /* 56.17 — Modal scale-fade */
        'modal-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95) translateY(-10px)' },
          '100%': { opacity: '1', transform: 'scale(1)    translateY(0)' },
        },
        /* 56.16 — Critical risk slow status pulse */
        'status-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.38' },
        },
        /* 56.9 — Page enter */
        'page-enter': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        /* 56.12 — SVG line draw */
        'draw-line': {
          '0%':   { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        /* Check appear */
        'check-appear': {
          '0%':   { opacity: '0', transform: 'scale(0.6) rotate(-10deg)' },
          '70%':  { transform: 'scale(1.1) rotate(2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        /* Progress pulse while active */
        'progress-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.72' },
        },
      },

      /* ── Named animations ── */
      animation: {
        /* Entrances */
        'fade-up':        'fade-up 0.50s ease-out both',
        'fade-in':        'fade-in 0.40s ease-out both',
        /* 56.1 */
        'bg-zoom':        'bg-zoom 9s ease-out forwards',
        /* 56.2 */
        'sweep':          'sweep 1.8s ease-in-out forwards',
        /* 56.3 */
        'slide-in-right': 'slide-in-right 0.50s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-left':  'slide-in-left  0.50s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':       'scale-in 0.32s cubic-bezier(0.34,1.56,0.64,1) both',
        /* 56.15 */
        'pulse-once':     'pulse-once 0.85s ease-out 0.2s both',
        /* 56.20 */
        'shimmer':        'shimmer 1.6s linear infinite',
        /* 56.4 */
        'flow-down':      'flow-down 2.8s ease-in-out infinite',
        /* 56.17 */
        'drawer-in':      'drawer-in 0.26s cubic-bezier(0.16,1,0.3,1)',
        'modal-in':       'modal-in  0.22s cubic-bezier(0.16,1,0.3,1)',
        /* 56.16 */
        'status-pulse':   'status-pulse 2.4s ease-in-out infinite',
        /* 56.9 */
        'page-enter':     'page-enter 0.38s ease-out both',
        /* 56.13 */
        'check-appear':   'check-appear 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        'progress-pulse': 'progress-pulse 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
