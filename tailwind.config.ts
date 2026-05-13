import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#fdfbf7',
        'warm-gold': '#e6b89c',
        'deep-brown': '#3e2723',
        'soft-gray': '#bdbdbd',
        'light-gold': '#f5e6d3',
        'glass-bg': 'rgba(255, 255, 255, 0.65)',
      },
      fontFamily: {
        serif: ['"Source Han Serif SC"', '"Noto Serif SC"', 'serif'],
        round: ['"Source Han Sans SC"', '"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'drift': 'drift 20s linear infinite',
        'breathe': 'breathe 6s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(230, 184, 156, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(230, 184, 156, 0.8)' },
        },
        drift: {
          '0%': { transform: 'translateY(100vh) scale(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-20vh) scale(1)', opacity: '0' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
export default config
