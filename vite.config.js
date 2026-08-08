import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve';

  return {
    plugins: [react()],
    base: '/',
    server: isDev
      ? {
          proxy: {
            '/api': {
              target: 'http://localhost:3001',
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  };
});
