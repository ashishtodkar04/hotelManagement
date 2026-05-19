import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { Buffer } from 'buffer'

import { fileURLToPath } from 'url'

// Generate transparent icons on startup to fix manifest errors
const transparentPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const pngBuffer = Buffer.from(transparentPngBase64, 'base64');
try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  fs.writeFileSync(path.resolve(__dirname, 'public/logo192.png'), pngBuffer);
  fs.writeFileSync(path.resolve(__dirname, 'public/logo512.png'), pngBuffer);
  fs.writeFileSync(path.resolve(__dirname, 'public/favicon.ico'), pngBuffer);
} catch (error) {
  console.warn('Icon pre-generation warning:', error);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
