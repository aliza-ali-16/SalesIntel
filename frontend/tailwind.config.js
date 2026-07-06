/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#090a0f',
        darkCard: '#121420',
        darkBorder: 'rgba(255,255,255,0.08)',
        accentPurple: '#8b5cf6',
        accentViolet: '#7c3aed',
        accentIndigo: '#6366f1',
        accentEmerald: '#10b981',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
