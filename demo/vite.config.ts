import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/use-password-policy/', // MUST match the repo name exactly
  plugins: [react()],
})
