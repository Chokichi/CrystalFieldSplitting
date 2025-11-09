import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

if (import.meta.env.DEV) {
  const originalError = console.error
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Invalid argument not valid semver')) {
      return
    }
    originalError.apply(console, args)
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
