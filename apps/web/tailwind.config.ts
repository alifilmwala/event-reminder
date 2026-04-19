import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ITS52-inspired deep green + gold palette
        brand: {
          50:  '#fdf8ec',
          100: '#faefc8',
          200: '#f3d97a',
          300: '#e8c14e',
          400: '#d4a843',
          500: '#c9a84c',
          600: '#b8922e',
          700: '#9a7620',
          800: '#7a5c18',
          900: '#5c4412',
          950: '#3a2a08',
        },
        // gold aliases brand for convenience in redesigned files
        gold: {
          50:  '#fdf8ec',
          100: '#faefc8',
          200: '#f3d97a',
          300: '#e8c14e',
          400: '#d4a843',
          500: '#c9a84c',
          600: '#b8922e',
          700: '#9a7620',
          800: '#7a5c18',
          900: '#5c4412',
          950: '#3a2a08',
        },
        forest: {
          50:  '#edfaf2',
          100: '#d4f2e0',
          200: '#a8e4c0',
          300: '#6fcf97',
          400: '#3db876',
          500: '#1a9a56',
          600: '#0d7a41',
          700: '#0a5c31',
          800: '#0a3d22',
          900: '#0a2918',
          950: '#071a0f',
        },
        // override Tailwind's green with ITS52 deep forest greens
        green: {
          50:  '#edfaf2',
          100: '#d4f2e0',
          200: '#a8e4c0',
          300: '#6fcf97',
          400: '#3db876',
          500: '#1a9a56',
          600: '#0d7a41',
          700: '#0a5c31',
          800: '#163822',
          900: '#0f2419',
          950: '#0a1a0f',
        },
        surface: {
          DEFAULT: '#0f2419',
          hover:   '#132d1e',
          border:  '#1e3d28',
          muted:   '#0a1a0f',
        },
        sidebar: '#071a0f',
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cinzel)', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};

export default config;
