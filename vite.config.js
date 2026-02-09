import { defineConfig } from 'vite';

export default defineConfig({
  test: {},
  server: {
    proxy: {
      '/gutenberg': {
        target: 'https://www.gutenberg.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gutenberg/, ''),
      },
      '/dwds-static': {
        target: 'https://www.dwds.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dwds-static/, ''),
      },
      '/dwds-api': {
        target: 'https://www.dwds.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dwds-api/, ''),
      },
    },
  },
});
