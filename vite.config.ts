import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const config = defineConfig(() => {
  return {
    plugins: [
      devtools(),
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'generateSW',
        includeAssets: ['favicon.ico', 'robots.txt', 'logo192.png', 'logo512.png'],
        manifest: {
          short_name: "Virtuoso",
          name: "Virtuoso - Piano Practice",
          description: "A refined piano practice assistant for scales and cadences.",
          icons: [
            {
              src: "/logo192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "/logo512.png",
              sizes: "512x512",
              type: "image/png"
            }
          ],
          start_url: "/",
          display: "standalone",
          theme_color: "#000000",
          background_color: "#ffffff",
          categories: ["productivity", "music"],
          screenshots: [
            {
              src: "/screenshot.png",
              sizes: "540x720",
              type: "image/png",
              form_factor: "narrow"
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          maximumFileSizeToCacheInBytes: 5000000,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.(js|css|png|jpg|jpeg|svg|gif|ico|woff2)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'assets-cache-v1',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            }
          ],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/\/api\//]
        }
      }),
      tailwindcss(),
      viteReact({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
    ],
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'tanstack-vendor': ['@tanstack/react-router'],
            'abcjs': ['abcjs']
          }
        }
      }
    }
  }
})

export default config
