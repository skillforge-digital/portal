/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./**/*.html",
    "./assets/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: { 
        grotesk: ['Space Grotesk', 'sans-serif'],
        serif: ['Instrument Serif', 'serif']
      },
      colors: {
        navy: { 950:'#040810', 900:'#070d1a', 800:'#0c1829', 700:'#112240', 600:'#1a3358' },
        gold: { 300:'#fcd34d', 400:'#fbbf24', 500:'#f59e0b', 600:'#d97706', 700:'#b45309' },
      }
    }
  },
  plugins: [],
}
