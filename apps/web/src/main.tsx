import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { config } from './config'
import './index.css'

// 设置 CSS 主题变量
document.documentElement.style.setProperty('--theme-primary', config.theme.primary);
document.documentElement.style.setProperty('--theme-secondary', config.theme.secondary);
document.documentElement.style.setProperty('--theme-gradient', config.theme.gradient);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
