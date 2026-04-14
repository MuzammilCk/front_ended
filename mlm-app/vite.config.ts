import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// remove this → import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    // remove this → tailwindcss(),
  ],
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
})