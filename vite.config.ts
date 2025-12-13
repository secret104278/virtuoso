import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'

const config = defineConfig(({ isSsrBuild }) => {
  return {
    plugins: [
      devtools(),
      cloudflare({ viteEnvironment: { name: 'ssr' } }),
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      !isSsrBuild ? VitePWA({
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
          background_color: "#ffffff"
        },
        workbox: {
          // Caching strategies
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          cleanupOutdatedCaches: true
        }
      }) : null,
      tailwindcss(),
      tanstackStart(),
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
            'tanstack-vendor': ['@tanstack/react-router', '@tanstack/react-start'],
            'abcjs': ['abcjs']
          }
        }
      }
    }
  }
})

export default config
