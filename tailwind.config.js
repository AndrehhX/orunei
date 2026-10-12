/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'] },
      colors: { brand: { DEFAULT: '#6d5cff', soft: '#ece9ff' } },
      transitionTimingFunction: { spring: 'cubic-bezier(.34,1.56,.64,1)', smooth: 'cubic-bezier(.22,1,.36,1)' },
      keyframes: {
        drop: { '0%': { opacity: 0, transform: 'translateY(-90px) scale(.8)' }, '60%': { opacity: 1, transform: 'translateY(8px) scale(1.03)' }, '100%': { opacity: 1, transform: 'none' } },
        bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } },
        floaty: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(24px,-30px) scale(1.08)' } },
        shake: { '0%,100%': { transform: 'none' }, '20%,60%': { transform: 'translateX(-8px)' }, '40%,80%': { transform: 'translateX(8px)' } },
        rise: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
        fade: { from: { opacity: 0 }, to: { opacity: 1 } },
      },
      animation: { rise: 'rise .6s cubic-bezier(.2,.8,.2,1) both', fade: 'fade .5s ease both', drop: 'drop .9s cubic-bezier(.34,1.3,.64,1) both', bob: 'bob 3.6s ease-in-out infinite', floaty: 'floaty 12s ease-in-out infinite', shake: 'shake .45s ease' },
    },
  },
  plugins: [],
}
