import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['../tests/unit/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['../tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['js/**'],
      exclude: ['js/app.js', 'js/settings.js'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});