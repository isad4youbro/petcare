import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync, readdirSync } from 'node:fs'

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss(), {
    name: 'petcare-publishable-assets',
    apply: 'build',
    generateBundle() {
      const illustrations = new URL('./public/assets/illustrations/', import.meta.url)
      for (const name of readdirSync(illustrations).filter(name => name.endsWith('-small.png'))) this.emitFile({ type:'asset', fileName:'assets/illustrations/' + name, source:readFileSync(new URL(name, illustrations)) })
      this.emitFile({ type:'asset', fileName:'third-party-licenses.txt', source:readFileSync(new URL('./THIRD_PARTY_LICENSES.txt', import.meta.url)) })
      this.emitFile({ type:'asset', fileName:'assets/heic-to-LICENSE.txt', source:readFileSync(new URL('./node_modules/heic-to/LICENSE', import.meta.url)) })
      for (const name of ['favicon.svg', 'sw.js']) this.emitFile({ type:'asset', fileName:name, source:readFileSync(new URL('./public/' + name, import.meta.url)) })
      for (const name of readdirSync(new URL('./public/assets/fonts/', import.meta.url)).filter(name => name.endsWith('.txt'))) this.emitFile({ type:'asset', fileName:'assets/fonts/' + name, source:readFileSync(new URL('./public/assets/fonts/' + name, import.meta.url)) })
      for (const name of ['swagger.html', 'swagger-init.js', 'rfc.html']) this.emitFile({ type:'asset', fileName:name, source:readFileSync(new URL('./public/' + name, import.meta.url)) })
      this.emitFile({ type:'asset', fileName:'openapi.json', source:readFileSync(new URL('../docs/openapi.json', import.meta.url)) })
    },
  }],
  build: { copyPublicDir: false },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (request) => {
            // The browser talks to Vite on 5173; the backend sees 8000 as Host.
            // Keep the backend's same-origin check enabled for real requests.
            request.setHeader('Origin', 'http://127.0.0.1:8000')
          })
        },
      },
    },
  },
})
