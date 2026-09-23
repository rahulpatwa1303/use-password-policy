import { writeFileSync } from 'node:fs';
import { defineConfig, type Options } from 'tsup';
import { passwordPolicyInputCss } from './src/styles';

const coreAsExternal: NonNullable<Options['esbuildPlugins']>[number] = {
  name: 'core-as-external',
  setup(build) {
    build.onResolve({ filter: /^\.\/core$/ }, () => ({ path: 'use-password-policy/core', external: true }));
  },
};

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
    // Import the core entry instead of bundling a second copy of it, so apps that use
    // both entries share one module (and one breach-check cache).
    esbuildPlugins: [coreAsExternal],
    onSuccess: async () => {
      writeFileSync('dist/styles.css', passwordPolicyInputCss + '\n');
    },
  },
]);
