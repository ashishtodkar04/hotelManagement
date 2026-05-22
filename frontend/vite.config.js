import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { Buffer } from 'buffer'

import { fileURLToPath } from 'url'

// Copy/generate icons on startup to ensure high-res brand visibility
try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const logoSrc = path.resolve(__dirname, 'public/logo.png');
  const faviconSrc = path.resolve(__dirname, 'public/favicon.png');
  
  const logoDest192 = path.resolve(__dirname, 'public/logo192.png');
  const logoDest512 = path.resolve(__dirname, 'public/logo512.png');
  const faviconDest = path.resolve(__dirname, 'public/favicon.ico');
  
  if (fs.existsSync(logoSrc)) {
    const logoBuffer = fs.readFileSync(logoSrc);
    fs.writeFileSync(logoDest192, logoBuffer);
    fs.writeFileSync(logoDest512, logoBuffer);
    fs.writeFileSync(faviconDest, logoBuffer);
  } else if (fs.existsSync(faviconSrc)) {
    const favBuffer = fs.readFileSync(faviconSrc);
    fs.writeFileSync(logoDest192, favBuffer);
    fs.writeFileSync(logoDest512, favBuffer);
    fs.writeFileSync(faviconDest, favBuffer);
  } else {
    // Fallback to transparent png if no logo exists
    const transparentPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const pngBuffer = Buffer.from(transparentPngBase64, 'base64');
    fs.writeFileSync(logoDest192, pngBuffer);
    fs.writeFileSync(logoDest512, pngBuffer);
    fs.writeFileSync(faviconDest, pngBuffer);
  }
} catch (error) {
  console.warn('Icon generation warning:', error);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
