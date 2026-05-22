/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import App from './App.jsx';
import './index.css';

function SafeGoogleOAuthProvider({ children }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId || clientId.includes('placeholder') || clientId.includes('v3p6b6b6') || clientId.trim() === '') {
    return <>{children}</>;
  }
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SafeGoogleOAuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ThemeProvider>
    </SafeGoogleOAuthProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
      .catch((err) => console.error('Service Worker registration failed:', err));
  });
}


