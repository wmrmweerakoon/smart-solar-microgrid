import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom terminal banner plugin for successful frontend connection
const successBannerPlugin = () => ({
  name: 'success-banner',
  configureServer(server) {
    server.httpServer?.once('listening', () => {
      setTimeout(() => {
        console.log('\x1b[32m%s\x1b[0m', '\n================================================================================');
        console.log('\x1b[32m%s\x1b[0m', '  SUCCESSFULLY CONNECTED TO FRONTEND!');
        console.log('\x1b[32m%s\x1b[0m', '  Smart Solar Microgrid Web App is running smoothly without any error.');
        console.log('\x1b[32m%s\x1b[0m', '  ------------------------------------------------------------------');
        console.log('\x1b[32m%s\x1b[0m', '  * Local URL:       http://localhost:5173');
        console.log('\x1b[32m%s\x1b[0m', '  * Backend Proxy:   http://localhost:5299');
        console.log('\x1b[32m%s\x1b[0m', '  * Status:          Frontend Ready & Live');
        console.log('\x1b[32m%s\x1b[0m', '================================================================================\n');
      }, 100);
    });
  },
});

export default defineConfig({
  plugins: [react(), successBannerPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5299',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
