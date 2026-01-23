import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Allow access from mobile devices on same network
    port: 5173,
  },
  base: '/void_walker/', // For GitHub Pages deployment
})
