import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BACKEND_URL } from './api/config'

// Directly connect all frontend API calls to Render backend in code
const originalFetch = window.fetch;
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string') {
    if (input.startsWith('/api')) {
      input = `${BACKEND_URL}${input}`;
    }
  } else if (input instanceof URL) {
    if (input.pathname.startsWith('/api')) {
      input = new URL(`${BACKEND_URL}${input.pathname}${input.search}`);
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
