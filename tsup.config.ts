import { writeFileSync } from 'node:fs';
import { defineConfig } from 'tsup';
import { passwordPolicyInputCss } from './src/styles';

export default defineConfig([
  {
    // Framework-free core: safe to import on the server.
    entry: { core: 'src/core.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    target: 'es2019',
  },
  {
    // React bindings. Marked as a client module for Next.js / RSC.
    entry: { index: 'src/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    target: 'es2019',
    external: ['react'],
    banner: { js: "'use client';" },
    onSuccess: async () => {
      writeFileSync('dist/styles.css', passwordPolicyInputCss + '\n');
    },
  },
]);
