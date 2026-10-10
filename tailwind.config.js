/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'] },
      colors: { brand: { DEFAULT: '#6d5cff', soft: '#ece9ff' } },
      keyframes: {
        rise: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
        fade: { from: { opacity: 0 }, to: { opacity: 1 } },
      },
      animation: { rise: 'rise .6s cubic-bezier(.2,.8,.2,1) both', fade: 'fade .5s ease both' },
    },
  },
  plugins: [],
}
