import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black:  '#0A0A0A',
          white:  '#FFFFFF',
          gray:   '#F5F5F5',
          border: '#E8E8E8',
          muted:  '#6B6B6B',
        },
      },
      fontFamily: {
        display: ['var(--font-space)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        sans:    ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-geist-mono)', 'monospace'],
        // legacy aliases
        poster:  ['var(--font-space)', 'Space Grotesk', 'sans-serif'],
        body:    ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        'none': '0px',
        'sm':   '4px',
        'md':   '8px',
        'lg':   '12px',
        'xl':   '16px',
        'full': '9999px',
      },
      boxShadow: {
        'card':      '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover':'0 4px 16px rgba(0,0,0,0.10)',
      },
      keyframes: {
        fadeUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-up': 'fadeUp 380ms cubic-bezier(0.0,0.0,0.2,1) both',
      },
    },
  },
  plugins: [],
}
export default config
