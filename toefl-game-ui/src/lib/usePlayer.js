import { useState, useEffect } from 'react'
import api from './api'

export function usePlayer() {
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('player_token')
    if (!token) { setLoading(false); return }

    api.get('/players/me')
      .then(r => setPlayer({ ...r.data.player, photo_url: r.data.photo_url }))
      .catch(() => { localStorage.removeItem('player_token') })
      .finally(() => setLoading(false))
  }, [])

  function logout() {
    localStorage.removeItem('player_token')
    window.location.href = '/'
  }

  return { player, setPlayer, loading, logout }
}
