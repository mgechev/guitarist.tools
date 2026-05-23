import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)

// Register service worker for offline capability (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const basePath = window.location.pathname.endsWith('/') 
      ? window.location.pathname 
      : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const swUrl = `${basePath}sw.js`;
    
    navigator.serviceWorker.register(swUrl)
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Detect when Material Symbols font is loaded to prevent FOIT/FLUT (Flash of Unstyled Text)
if ('fonts' in document) {
  Promise.race([
    document.fonts.load('24px "Material Symbols Outlined"'),
    new Promise((resolve) => setTimeout(resolve, 1500)) // Max 1.5s timeout
  ]).then(() => {
    document.documentElement.classList.add('fonts-loaded');
  }).catch(() => {
    document.documentElement.classList.add('fonts-loaded');
  });
} else {
  document.documentElement.classList.add('fonts-loaded');
}


