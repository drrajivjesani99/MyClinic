import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { subscribeToPush } from './lib/notifications'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Ask for push permission after 3 seconds
setTimeout(() => {
  subscribeToPush()
}, 3000)
