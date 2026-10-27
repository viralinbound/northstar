import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    // three.js (~190 kB gzip) is only fetched lazily with the 3D scenes
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Keep the heavy 3D runtime out of the first-paint bundle.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/node_modules[\/](react|react-dom|scheduler)[\/]/.test(id)) return 'react'
          if (/node_modules[\/]three[\/]/.test(id)) return 'three'
          if (/node_modules[\/]gsap[\/]/.test(id)) return 'gsap'
        },
      },
    },
  },
})
