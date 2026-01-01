import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import "@arcgis/core/assets/esri/themes/light/main.css";
import { BrowserRouter } from 'react-router-dom'

import { defineCustomElements } from "@arcgis/map-components/loader";
defineCustomElements(window);

window.esriConfig = {
  apiKey: import.meta.env.VITE_ESRI_API_KEY,
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)
