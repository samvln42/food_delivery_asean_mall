import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // ไม่ต้องการ manifest สำหรับ "install as app"
      manifest: false,
      workbox: {
        // Cache static assets (JS, CSS, fonts, icons)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Runtime caching สำหรับรูปภาพ venue/restaurant จาก server
        runtimeCaching: [
          {
            // Cache รูปภาพจาก media server (Django /media/ path)
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/media/') ||
              url.pathname.includes('/uploads/') ||
              /\.(jpg|jpeg|png|webp|gif)$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'asean-mall-images-v1',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 วัน
              },
              cacheableResponse: {
                statuses: [0, 200], // 0 = opaque response (cross-origin)
              },
            },
          },
          {
            // Cache flag images (country flags)
            urlPattern: ({ url }) => url.pathname.startsWith('/media/countries/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'asean-mall-flags-v1',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 วัน
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
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
