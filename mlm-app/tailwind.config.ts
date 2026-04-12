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
      }
    },
  },
  plugins: [],
}