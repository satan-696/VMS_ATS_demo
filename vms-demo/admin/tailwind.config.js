/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          primary: '#003366',
          secondary: '#00509d',
          accent: '#f97316',
          bg: '#f1f5f9',
          surface: '#ffffff',
          text: '#1e293b',
          'text-muted': '#64748b',
          border: '#e2e8f0',
          success: '#15803d',
          error: '#b91c1c',
          warning: '#b45309',
          // Admin-specific
          sidebar: '#003366',
          'sidebar-hover': '#00509d',
        }
      },
      fontFamily: {
        sans: ['Noto Sans', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
