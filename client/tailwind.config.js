/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // New design system
        base:            '#07070f',
        surface:         '#0e0e1c',
        elevated:        '#151528',
        border:          '#1f1f3d',
        'border-light':  '#2a2a4a',
        primary:         '#6366f1',
        'primary-hover': '#4f46e5',
        'primary-glow':  'rgba(99,102,241,0.15)',
        accent:          '#8b5cf6',
        success:         '#10b981',
        warning:         '#f59e0b',
        danger:          '#ef4444',
        'text-primary':  '#f8fafc',
        'text-secondary':'#94a3b8',
        'text-muted':    '#475569',

        // Legacy aliases (keep existing pages working)
        bg: {
          base:    '#07070f',
          surface: '#0e0e1c',
          card:    '#151528',
        },
        text: {
          muted: '#475569',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        serif: ['Georgia', 'serif'],
      },
      animation: {
        'pulse-slow':  'pulse 3s ease-in-out infinite',
        'fade-in':     'fadeIn 0.5s ease-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'glow-pulse':  'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0)' },
          '50%':      { boxShadow: '0 0 20px 4px rgba(99,102,241,0.2)' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(99,102,241,0.25)',
        'glow':    '0 0 24px rgba(99,102,241,0.3)',
        'glow-lg': '0 0 48px rgba(99,102,241,0.2)',
      },
    },
  },
  plugins: [],
}
