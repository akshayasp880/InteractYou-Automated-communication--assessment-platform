import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Path aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Development server config
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to Flask backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy video feed to Flask backend
      '/video_feed': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  // Build config
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})