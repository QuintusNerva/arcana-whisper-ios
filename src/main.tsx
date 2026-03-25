import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { OfflineNotice } from './components/OfflineNotice.tsx'
import './index.css'

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <OfflineNotice />
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
} catch (e: any) {
  const el = document.getElementById('root');
  if (el) el.innerHTML = `<pre style="color:red;padding:20px;font-size:12px;">${e?.message}\n${e?.stack}</pre>`;
}
