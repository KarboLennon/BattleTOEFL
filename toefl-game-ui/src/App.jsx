import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { usePlayer } from './lib/usePlayer'
import OnboardingPage from './pages/OnboardingPage'
import HomePage from './pages/HomePage'
import LobbyPage from './pages/LobbyPage'
import BattlePage from './pages/BattlePage'
import ScorePage from './pages/ScorePage'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('player_token')
  if (!token) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { player, setPlayer, loading } = usePlayer()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--nb-yellow)' }}>
        <div className="nb-card p-8 text-center">
          <div className="text-4xl mb-3"></div>
          <p className="font-bold text-xl">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            player
              ? <Navigate to="/home" replace />
              : <OnboardingPage onRegistered={(p) => setPlayer(p)} />
          }
        />
        <Route path="/home" element={
          <ProtectedRoute><HomePage /></ProtectedRoute>
        } />
        <Route path="/room/:code" element={
          <ProtectedRoute><LobbyPage /></ProtectedRoute>
        } />
        <Route path="/battle/:code" element={
          <ProtectedRoute><BattlePage /></ProtectedRoute>
        } />
        <Route path="/score/:gameId" element={
          <ProtectedRoute><ScorePage /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
