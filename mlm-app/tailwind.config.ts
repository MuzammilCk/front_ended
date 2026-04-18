import type { Config } from 'tailwindcss';
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        muted: '#ddcca8',
        subtle: '#5a4d42',
        gold: '#b8924a',
        void: '#0a0705',
        sand: '#c9a96e',
        ghost: 'rgba(255, 255, 255, 0.04)',
        veil: 'rgba(255, 255, 255, 0.08)',
        'text-primary': '#e8dcc8'
      }
    },
  },
  plugins: [],
}