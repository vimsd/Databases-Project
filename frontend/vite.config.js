import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // ⭐ สำคัญมากสำหรับ Docker
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://cinema_backend:5000', // ⭐ ชื่อ service backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
