import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Dynamic API URL for Vercel -> Render cross-origin deployment
const DEFAULT_BACKEND_URL = 'https://examportal-a5f9.onrender.com';
if (typeof window !== 'undefined' && !localStorage.getItem('ANVESHANA_API_URL')) {
  localStorage.setItem('ANVESHANA_API_URL', DEFAULT_BACKEND_URL);
}

export const getApiBase = () => {
  if (typeof window === 'undefined') return '';
  const custom = localStorage.getItem('ANVESHANA_API_URL');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  return (import.meta.env.VITE_API_URL || DEFAULT_BACKEND_URL).trim().replace(/\/+$/, '');
};

const originalFetch = window.fetch;
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const base = getApiBase();
  if (base && typeof input === 'string' && input.startsWith('/api')) {
    input = `${base}${input}`;
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
