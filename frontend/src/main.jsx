import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/golos-text/wght.css'
import './index.css'
import './app.css'
import './pixel.css'
import './theme.css'
import './game-ui.css'
import './panels.css'
import './visual.css'
import { initialTheme } from './components/theme-toggle'
import App from './App.jsx'

document.documentElement.dataset.theme = initialTheme()
document.documentElement.classList.toggle('dark', initialTheme() === 'dark')

createRoot(document.getElementById('root')).render(<App />)
