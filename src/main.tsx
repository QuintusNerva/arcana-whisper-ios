import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Catch uncaught errors and display them visually (debug)
window.onerror = (msg, src, line, col, err) => {
  const el = document.getElementById('root');
  if (el) el.innerHTML = `<pre style="color:red;padding:20px;font-size:12px;word-wrap:break-word;">${msg}\n${src}:${line}:${col}\n${err?.stack || ''}</pre>`;
};

window.addEventListener('unhandledrejection', (e) => {
  const el = document.getElementById('root');
  if (el) el.innerHTML = `<pre style="color:red;padding:20px;font-size:12px;word-wrap:break-word;">Unhandled: ${e.reason}</pre>`;
});

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (e: any) {
  const el = document.getElementById('root');
  if (el) el.innerHTML = `<pre style="color:red;padding:20px;font-size:12px;">${e?.message}\n${e?.stack}</pre>`;
}
