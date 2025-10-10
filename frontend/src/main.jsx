import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Logs from '../components/Logs.jsx'
import App from './App.jsx'
import Header from '../components/header.jsx'
import Footer from '../components/Footer.jsx'
import { BrowserRouter, Routes, Route } from 'react-router'
import About from '../components/About.jsx'
createRoot(document.getElementById('root')).render(
  <>
    <Header />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="dashboard" element={<App />} />
          <Route path="logs" element={<Logs />} />
          <Route path="docs" element={<App />} />
          <Route path="about" element={<About />} />
        </Routes>
      </BrowserRouter>,
    <Footer />
  </>
)
