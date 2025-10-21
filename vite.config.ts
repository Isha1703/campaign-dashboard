import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error - backend may not be running on port 8002');
          });
        }
      }
      // Removed agent_outputs proxy - let Vite serve them as static files from public/
    },
    fs: {
      allow: ['..', '.', '../agent_outputs']
    }
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})