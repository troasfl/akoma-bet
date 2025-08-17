import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: ['playwright', 'playwright-core']
    }
  },
  define: {
    'import.meta.env': 'import.meta.env'
  },
  optimizeDeps: {
    exclude: ['playwright', 'playwright-core']
  }
})
