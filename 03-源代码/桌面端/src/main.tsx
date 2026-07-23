import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastProvider } from './shared/components/toast/Toast'
import App from './App'
import './styles.css'
import './shared/components/expandable/expandable.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
)
