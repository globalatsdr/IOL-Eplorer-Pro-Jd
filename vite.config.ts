import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
    'process.env': process.env
  },
  // This is crucial for GitHub Pages to find the assets
  base: './',
  build: {
    rollupOptions: {
      external: ['html2canvas', 'jspdf'],
      output: {
        globals: {
          html2canvas: 'html2canvas',
          jspdf: 'jspdf'
        }
      }
    }
  }
})