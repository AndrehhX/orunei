import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ImagesProvider } from './images.jsx'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(<ImagesProvider><App /></ImagesProvider>)
