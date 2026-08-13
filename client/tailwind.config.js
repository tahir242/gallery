/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: {
          50:  'rgb(var(--accent-50)  / <alpha-value>)',
          100: 'rgb(var(--accent-100) / <alpha-value>)',
          200: 'rgb(var(--accent-200) / <alpha-value>)',
          300: 'rgb(var(--accent-300) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
          700: 'rgb(var(--accent-700) / <alpha-value>)',
          800: 'rgb(var(--accent-800) / <alpha-value>)',
          900: 'rgb(var(--accent-900) / <alpha-value>)',
          950: 'rgb(var(--accent-950) / <alpha-value>)',
        },
        surface: {
          50:  'rgb(var(--surface-50)  / <alpha-value>)',
          100: 'rgb(var(--surface-100) / <alpha-value>)',
          200: 'rgb(var(--surface-200) / <alpha-value>)',
          300: 'rgb(var(--surface-300) / <alpha-value>)',
          400: 'rgb(var(--surface-400) / <alpha-value>)',
          500: 'rgb(var(--surface-500) / <alpha-value>)',
          600: 'rgb(var(--surface-600) / <alpha-value>)',
          700: 'rgb(var(--surface-700) / <alpha-value>)',
          800: 'rgb(var(--surface-800) / <alpha-value>)',
          850: 'rgb(var(--surface-850) / <alpha-value>)',
          900: 'rgb(var(--surface-900) / <alpha-value>)',
          925: 'rgb(var(--surface-925) / <alpha-value>)',
          950: 'rgb(var(--surface-950) / <alpha-value>)',
        },
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
      },
      borderRadius: {
        'card': '8px',
        'tile': '6px',
        'pill': '9999px',
      },
      animation: {
        'fade-in':       'fadeIn 0.2s ease-out',
        'fade-out':      'fadeOut 0.15s ease-in forwards',
        'slide-up':      'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)',
        'slide-down':    'slideDown 0.25s cubic-bezier(0.22,1,0.36,1)',
        'slide-left':    'slideLeft 0.3s cubic-bezier(0.22,1,0.36,1)',
        'zoom-in':       'zoomIn 0.2s cubic-bezier(0.22,1,0.36,1)',
        'blur-in':       'blurIn 0.25s ease-out',
        'scale-in':      'scaleIn 0.2s cubic-bezier(0.22,1,0.36,1)',
        'shimmer':       'shimmer 1.6s infinite',
        'spin':          'spin 1s linear infinite',
        'pulse-dot':     'pulseDot 2s ease-in-out infinite',
        'toast-in':      'toastIn 0.3s cubic-bezier(0.22,1,0.36,1)',
        'toast-out':     'toastOut 0.2s ease-in forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        fadeOut: {
          from: { opacity: '1' },
          to:   { opacity: '0' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        zoomIn: {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        blurIn: {
          from: { opacity: '0', filter: 'blur(8px)', transform: 'scale(0.98)' },
          to:   { opacity: '1', filter: 'blur(0)',   transform: 'scale(1)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        pulseDot: {
          '0%,100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':     { opacity: '0.4', transform: 'scale(0.75)' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.96)' },
          to:   { opacity: '1', transform: 'translateY(0)    scale(1)' },
        },
        toastOut: {
          from: { opacity: '1' },
          to:   { opacity: '0', transform: 'translateY(8px)' },
        },
      },
      boxShadow: {
        'accent-glow':  '0 0 24px rgba(99,102,241,0.3)',
        'image-hover':  '0 8px 32px rgba(0,0,0,0.6)',
        'card':         '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover':   '0 4px 16px rgba(0,0,0,0.55)',
        'overlay':      '0 24px 80px rgba(0,0,0,0.8)',
        'panel':        '4px 0 24px rgba(0,0,0,0.5)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.22,1,0.36,1)',
      },
    },
  },
  plugins: [],
};
