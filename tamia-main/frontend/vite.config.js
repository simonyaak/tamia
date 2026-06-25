import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const backendProxy = {
  target: 'http://127.0.0.1:8000',
  changeOrigin: true,
  secure: false,
  cookieDomainRewrite: 'localhost',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png', 'icons.svg', 'app-icon.svg'],
      manifest: {
        name: 'Tamia Marketplace',
        short_name: 'Tamia',
        description: 'The premium marketplace for everything in Uganda',
        theme_color: '#F28500',
        background_color: '#F28500',
        icons: [
          {
            src: 'app-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': backendProxy,
      '/auth': backendProxy,
      '/login': backendProxy,
      '/register': backendProxy,
      '/logout': backendProxy,
      '/listings': backendProxy,      
      '/storage': backendProxy,    
      '/s/': backendProxy,
    },
  },
})
