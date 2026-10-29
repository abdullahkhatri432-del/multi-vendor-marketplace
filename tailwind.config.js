/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Violet-indigo brand
        primary: {
          50: '#f3f1ff',
          100: '#eae5ff',
          200: '#d6ccff',
          300: '#b7a4ff',
          400: '#9575ff',
          500: '#7549ff',
          600: '#5b3df5',
          700: '#4a2ee0',
          800: '#3d26b8',
          900: '#332194',
          950: '#1c1055',
        },
        // Warm neutral canvas
        surface: {
          50: '#faf9f7',
          100: '#f3f1ed',
          200: '#e6e3dc',
          300: '#d2cec4',
          400: '#a8a399',
          500: '#7b766c',
          600: '#5b574f',
          700: '#44413b',
          800: '#2b2926',
          900: '#191816',
          950: '#0c0b0a',
        },
        // Editorial near-black
        ink: {
          DEFAULT: '#0b0b0f',
          soft: '#5b574f',
          muted: '#8f8a80',
        },
        // Warm gold accent
        accent: {
          DEFAULT: '#e8b04b',
          light: '#f6d68a',
          dark: '#b9801f',
        },
        success: '#12b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-xs': ['2.5rem', { lineHeight: '1.12', letterSpacing: '-0.03em' }],
        'display-sm': ['3.25rem', { lineHeight: '1.08', letterSpacing: '-0.035em' }],
        'display-md': ['4.25rem', { lineHeight: '1.03', letterSpacing: '-0.04em' }],
        'display-lg': ['5.5rem', { lineHeight: '0.98', letterSpacing: '-0.045em' }],
        'display-xl': ['7rem', { lineHeight: '0.94', letterSpacing: '-0.05em' }],
      },
      letterSpacing: {
        tightest: '-0.05em',
        tighter2: '-0.035em',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        30: '7.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-up': 'fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 7s ease-in-out infinite',
        'float-slow': 'float 11s ease-in-out infinite',
        'blob': 'blob 14s infinite ease-in-out',
        'marquee': 'marquee 38s linear infinite',
        'marquee-rev': 'marqueeRev 38s linear infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
        'gradient-x': 'gradientX 8s ease infinite',
        'spin-slow': 'spin 18s linear infinite',
        'ping-slow': 'pingSlow 3.2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'shine': 'shine 3.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(2rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -50px) scale(1.12)' },
          '66%': { transform: 'translate(-30px, 30px) scale(0.9)' },
        },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        marqueeRev: { '0%': { transform: 'translateX(-50%)' }, '100%': { transform: 'translateX(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        pingSlow: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '75%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        shine: {
          '0%': { transform: 'translateX(-120%)' },
          '60%, 100%': { transform: 'translateX(220%)' },
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(11,11,15,0.04), 0 8px 24px -8px rgba(11,11,15,0.08)',
        premium: '0 24px 60px -20px rgba(11,11,15,0.18)',
        card: '0 2px 4px rgba(11,11,15,0.03), 0 18px 40px -18px rgba(11,11,15,0.14)',
        'card-hover': '0 40px 80px -28px rgba(11,11,15,0.28)',
        glow: '0 0 40px rgba(117,73,255,0.32)',
        'glow-accent': '0 0 40px rgba(232,176,75,0.35)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 40px rgba(91,61,245,0.16)',
        luxe: '0 1px 0 rgba(255,255,255,0.6) inset, 0 30px 70px -30px rgba(11,11,15,0.35)',
      },
      backgroundImage: {
        'grid-ink':
          'linear-gradient(to right, rgba(11,11,15,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,11,15,0.05) 1px, transparent 1px)',
        'grid-light':
          'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
