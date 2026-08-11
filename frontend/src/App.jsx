import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import DarkVeil from './components/DarkVeil'
import TextType from './components/TextType'
import SpecularButton from './components/SpecularButton'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import NewBug from './pages/NewBug'
import Bugs from './pages/Bugs'
import './App.css'

function ProtectedRoute({ user, loading, children }) {
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function LandingPage({ user }) {
  const [typingComplete, setTypingComplete] = useState(false)

  return (
    <div className="app">
      <div className="bg">
        <DarkVeil />
      </div>
      <Navbar />
      <section className="hero">
        <div className="hero-content">
          <div className="hero-title">
            <div className="hero-pill glare-hover">
              <span className="hero-pill-dot"></span>
              Your bugs. Your fixes. Your knowledge.
            </div>
            {!typingComplete ? (
              <TextType
                text="Turn every bug into a lesson."
                typingSpeed={75}
                pauseDuration={1500}
                showCursor={true}
                cursorCharacter="|"
                textColors={['#ffffff']}
                loop={false}
                onSentenceComplete={() => setTypingComplete(true)}
              />
            ) : (
              <>
                <div>Turn every bug</div>
                <div>
                  into a <span style={{ color: '#7C3AED' }}>lesson.</span>
                </div>
              </>
            )}
          </div>
          <p className="hero-subtitle">
            <span style={{ fontWeight: 700, color: '#7C3AED' }}>BugVault</span> is your personal space to track, understand and revisit bugs you've solved
          </p>
          <SpecularButton
            size="lg"
            radius={20}
            tint="#7C3AED"
            tintOpacity={0.3}
            textColor="#ffffff"
            lineColor="#ffffff"
            baseColor="#5227FF"
            intensity={1}
            shineSize={10}
            shineFade={40}
            thickness={1}
            followMouse={true}
            proximity={250}
            onClick={() => window.location.href = user ? '/home' : '/signup'}
            className="hero-cta"
          >
            Get Started
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginLeft: '8px' }}
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </SpecularButton>
        </div>
      </section>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:7000/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage user={user} />} />
        <Route path="/login" element={user ? <Navigate to="/home" replace /> : <Login setUser={setUser} />} />
        <Route path="/signup" element={user ? <Navigate to="/home" replace /> : <Signup setUser={setUser} />} />
        <Route path="/home" element={
          <ProtectedRoute user={user} loading={loading}>
            <Home user={user} setUser={setUser} />
          </ProtectedRoute>
        } />
        <Route path="/bugs" element={
          <ProtectedRoute user={user} loading={loading}>
            <Bugs user={user} setUser={setUser} />
          </ProtectedRoute>
        } />
        <Route path="/bugs/new" element={
          <ProtectedRoute user={user} loading={loading}>
            <NewBug />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
