import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // `~foo/bar` -> `<root>/src/foo/bar`. A single wildcard, so new top-level
    // folders under src/ are picked up automatically with no config change.
    alias: [
      {
        find: /^~(.+)$/,
        replacement: `${fileURLToPath(new URL('./src', import.meta.url))}/$1`,
      },
    ],
  },
  server: {
    // Spotify only allows the redirect URIs registered for the "sound-light" app,
    // which are bound to http://localhost:3000 — keep dev on this port.
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          aws: [
            '@aws-sdk/client-cognito-identity',
            '@aws-sdk/client-dynamodb',
            '@aws-sdk/credential-provider-cognito-identity',
            '@aws-sdk/lib-dynamodb',
          ],
          validation: ['zod'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.config.*', '**/test/**', '**/*.d.ts', 'infra/**'],
    },
  },
});
