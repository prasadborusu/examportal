import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Dynamic API URL for Vercel -> Render cross-origin deployment
const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
if (apiBase) {
  const originalFetch = window.fetch;
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api')) {
      input = `${apiBase}${input}`;
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
