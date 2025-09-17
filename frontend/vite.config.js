import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // ปรับปรุงการ bundle
    rollupOptions: {
      output: {
        manualChunks: {
          // แยก vendor libraries ออกเป็น chunk แยก
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
          charts: ['chart.js', 'react-chartjs-2'],
          forms: ['react-hook-form', '@hookform/resolvers', 'yup'],
          query: ['@tanstack/react-query'],
          icons: ['react-icons'],
          http: ['axios']
        }
      }
    },
    // เพิ่มขนาด chunk warning threshold
    chunkSizeWarningLimit: 1000,
    // เปิด minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // ลบ console.log ใน production
        drop_debugger: true
      }
    }
  },
  server: {
    watch: {
      usePolling: true,
    },
    host: '0.0.0.0',
    strictPort: true,
    port: 3000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'matjyp.com'
    ],
    hmr: {
      overlay: false,
    }
  },
  // เพิ่ม resolve alias สำหรับ performance
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
