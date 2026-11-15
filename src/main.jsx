import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { AiChatProvider } from './context/AiChatContext'
import './index.css'
import "./App.css";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AiChatProvider>
        <App />
      </AiChatProvider>
    </AuthProvider>
  </React.StrictMode>,
)
