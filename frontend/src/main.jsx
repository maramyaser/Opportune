import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PasswordResetPage from './PasswordResetPage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {window.location.pathname.replace(/\/$/, '') ===
    '/reset-password' ? (
      <PasswordResetPage />
    ) : (
      <App />
    )}
  </StrictMode>,
)
