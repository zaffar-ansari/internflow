/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        // Brand: B&W palette
        primary: {
          50:  '#f9fafb',   // near-white
          100: '#f3f4f6',   // light gray
          200: '#e5e7eb',   // border gray
          300: '#d1d5db',
          400: '#9ca3af',   // muted
          500: '#6b7280',   // mid gray
          600: '#1f2937',   // dark gray (replaces indigo-600)
          700: '#111827',   // near-black
          800: '#0a0a0a',
          900: '#000000',   // pure black
          950: '#000000',
        }
      },
      animation: {
        'fade-in':       'fadeIn 0.25s ease-out both',
        'slide-up':      'slideUp 0.2s ease-out both',
        'slide-in-left': 'slideInLeft 0.25s ease-out both',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'   },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)'       },
        },
        slideInLeft: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)'     },
        },
      }
    },
  },
  plugins: [],
}
