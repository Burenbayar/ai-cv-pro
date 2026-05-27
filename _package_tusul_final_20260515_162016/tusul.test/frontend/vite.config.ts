import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, __dirname, '');
  const proxyTarget = env.VITE_API_PROXY_TARGET?.trim();

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@shared': path.resolve(__dirname, '../backend/src/lib'),
      },
    },
    server: {
      port: 5173,
      proxy: proxyTarget
        ? {
            '/api': {target: proxyTarget, changeOrigin: true},
          }
        : undefined,
    },
  };
});
