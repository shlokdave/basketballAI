import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import 'bootstrap/dist/css/bootstrap.css'
import HomePage from './pages/HomePage'
import AnalyzePage from './pages/AnalyzePage'
import ComparePlayers from './pages/ComparePlayers'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/compare" element={<ComparePlayers />} />
      </Routes>
    </Router>
  </StrictMode>,
)
