import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: Record<string, unknown>;
  }
}

if (typeof window !== 'undefined') {
  if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {};
  }
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__!;
  hook.isDisabled = true;
}

// Suppress React DevTools version compatibility warnings
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Invalid argument not valid semver')) {
      return; // Suppress this specific error
    }
    originalError.apply(console, args);
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
