import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

if (import.meta.env.DEV) {
  // This will import selfTest only if the file exists. If not, it does nothing.
  const _mods = import.meta.glob('./dev/selfTest.{js,jsx,ts,tsx}', { eager: true })
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

