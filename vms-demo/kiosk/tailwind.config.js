/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ats: {
          bg: '#020617',     // Darkest slate
          panel: '#0f172a',  // Slate blue panels
          accent: '#22d3ee', // Neon Cyan
          'accent-dim': 'rgba(34, 211, 238, 0.2)',
          danger: '#ef4444', // Security Red
          'danger-dim': 'rgba(239, 68, 68, 0.2)',
          success: '#10b981', // Matrix Green
          border: '#1e293b',
        },
        gov: {
          blue: '#1a3c6e',
          'blue-light': '#2a5298',
          'blue-bg': '#eef2f9',
          white: '#ffffff',
          orange: '#e07b00',
          green: '#1a7a4a',
          red: '#c0392b',
          amber: '#c47d00',
          gray: '#f4f6f9',
          border: '#ccd6e8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
        mono: ['Roboto Mono', 'fira-code', 'monospace'],
        display: ['Rajdhani', 'sans-serif'],
      },
      backgroundImage: {
        'scanline': 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(34, 211, 238, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(34, 211, 238, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
