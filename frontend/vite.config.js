// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import path, { dirname } from 'node:path';
// import { fileURLToPath } from 'node:url';

// const __dirname = dirname(fileURLToPath(import.meta.url));

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, 'src'),
//     },
//   },
// });

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  server: {
    host: '0.0.0.0',
    port: 5185,
    strictPort: true,
    cors: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://host.docker.internal:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Proxy request:', req.method, req.url, '->',
              options.target + proxyReq.path);
          });
          proxy.on('error', (err) => {
            console.error('Proxy error:', err);
          });
        }
      }
    }
  }
});
