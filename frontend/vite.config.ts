import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['leaflet', 'react-leaflet', '@react-leaflet/core'],
  },
  build: {
    // Split heavy vendors into separate cacheable chunks
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          map: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
  server: {
    host: true, // listen on LAN so phones/tablets on the same Wi-Fi can open the app
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
