import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  // `basicSsl` serves dev + preview over HTTPS with a self-signed cert so the
  // origin matches the Spotify redirect URI (https://localhost:3000/…). The
  // browser will warn once about the untrusted cert — accept it to continue.
  plugins: [react(), tailwindcss(), basicSsl()],
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
    // Serve on the loopback IP (not `localhost`): since April 2025 Spotify
    // rejects `localhost` redirect URIs as insecure and requires `127.0.0.1`.
    // The redirect URI is derived from the origin, so this makes it
    // https://127.0.0.1:3000/auth/spotify/. Keep the port fixed to match the
    // URIs registered on the Spotify + Google apps.
    host: '127.0.0.1',
    port: 3000,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
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
