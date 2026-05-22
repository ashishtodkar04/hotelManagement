import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
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
  }
} catch (error) {
  console.warn('Icon generation warning:', error);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI / icons
          'ui-vendor': ['lucide-react'],
          // Charts
          'chart-vendor': ['recharts'],
          // Socket.io
          'socket-vendor': ['socket.io-client'],
          // Other state/data
          'state-vendor': ['zustand', 'axios', '@react-oauth/google'],
        }
      }
    }
  }
})
