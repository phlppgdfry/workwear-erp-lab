import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  // The static demo runs entirely in the browser; Next.js retains this
  // directive in the shared source, while this build removes it before Rollup.
  plugins: [{
    name: 'demo-client-directive',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('/app/ExceptionTable.tsx')) {
        return { code: code.replace(/^"use client";\s*/, ''), map: null };
      }
    },
  }],
  esbuild: { jsx: 'automatic' },
  build: { outDir: '../demo-dist', emptyOutDir: true },
});
