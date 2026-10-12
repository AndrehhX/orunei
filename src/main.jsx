import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { NewsProvider } from './news.jsx'
import { RecProvider } from './rec/rec.jsx'
import { ImagesProvider } from './images.jsx'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(<ErrorBoundary><ImagesProvider><NewsProvider><RecProvider><App /></RecProvider></NewsProvider></ImagesProvider></ErrorBoundary>)
