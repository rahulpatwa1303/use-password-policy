import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/use-password-policy/', // must match the repo name
  plugins: [react()],
  // zxcvbn's dictionaries load on demand as one ~1.2 MB chunk; that's expected.
  build: { chunkSizeWarningLimit: 1300 },
})
