import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/', // ⬅️ pakai '/' jika deploy ke vercel
  plugins: [react()],
})