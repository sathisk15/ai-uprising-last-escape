/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      colors: {
        'core-red': '#ff2a2a',
        'core-orange': '#ff6a00',
        'core-cyan': '#00f5ff',
        'core-dark': '#0a0a0f',
      },
    },
  },
  plugins: [],
}
