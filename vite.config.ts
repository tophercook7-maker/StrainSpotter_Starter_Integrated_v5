import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist', target: 'es2018', sourcemap: false },
  server: { port: 5173 }
})
