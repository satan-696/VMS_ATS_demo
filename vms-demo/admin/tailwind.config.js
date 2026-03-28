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
        sans: ['Noto Sans', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
