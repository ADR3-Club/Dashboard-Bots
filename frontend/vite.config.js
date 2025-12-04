import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual code splitting for better performance
        manualChunks: {
          // Separate Chart.js and dependencies
          'chart': ['chart.js', 'react-chartjs-2', 'date-fns'],
          // Separate React Query
          'react-query': ['@tanstack/react-query'],
          // Separate React Router
          'react-router': ['react-router-dom'],
          // Separate UI libraries
          'ui-libs': ['lucide-react', 'zustand'],
        }
      }
    }
  }
})
