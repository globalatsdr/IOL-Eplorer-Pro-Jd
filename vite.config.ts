import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
 
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