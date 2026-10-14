import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { streamMiddleware } from './src/api/streamServer.js'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'stream-middleware-plugin',
      configureServer(server) {
        server.middlewares.use(streamMiddleware)
      },
      configurePreviewServer(server) {
        server.middlewares.use(streamMiddleware)
      }
    }
  ]
})
