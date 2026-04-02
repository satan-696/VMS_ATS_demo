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
          primary: '#003366',    // Prussian Blue
          secondary: '#00509d',  // Lighter blue
          accent: '#f97316',     // Saffron/Orange
          bg: '#f8fafc',         // Off-white / light slate
          surface: '#ffffff',
          text: '#1e293b',       // Dark slate text
          'text-muted': '#64748b',
          border: '#e2e8f0',
          success: '#166534',
          error: '#991b1b',
          warning: '#854d0e',
        }
      },
      fontFamily: {
        sans: ['Noto Sans', 'Inter', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      boxShadow: {
        'gov': '0 4px 6px -1px rgba(0, 51, 102, 0.05), 0 2px 4px -1px rgba(0, 51, 102, 0.03)',
        'gov-lg': '0 10px 15px -3px rgba(0, 51, 102, 0.1), 0 4px 6px -2px rgba(0, 51, 102, 0.05)',
      }
    },
  },
  plugins: [],
}
