import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function LobbyPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [participants, setParticipants] = useState([])
  const [isHost, setIsHost] = useState(false)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const navigatedRef = useRef(false)

  const goToBattle = useCallback(() => {
    if (navigatedRef.current) return
    navigatedRef.current = true
    navigate(`/battle/${code}`, { replace: true })
  }, [code, navigate])

  // Initial room load
  useEffect(() => {
    api.get(`/rooms/${code}`)
      .then(res => {
        const { room, participants, is_host } = res.data
        if (room.status === 'active') { goToBattle(); return }
        if (room.status === 'finished') { navigate('/home', { replace: true }); return }
        setRoom(room)
        setParticipants(participants)
        setIsHost(is_host)
      })
      .catch(() => navigate('/home'))
  }, [code])

  // Polling — refresh peserta + cek status game setiap 3 detik
  useEffect(() => {
    if (!room) return
    const poll = setInterval(async () => {
      if (navigatedRef.current) { clearInterval(poll); return }
      try {
        const res = await api.get(`/rooms/${code}`)
        setParticipants(res.data.participants)
        if (res.data.room.status === 'active') {
          clearInterval(poll)
          goToBattle()
        }
      } catch { /* ignore */ }
    }, 3000)
    return () => clearInterval(poll)
  }, [room, code])

  async function startGame() {
    setStarting(true); setError('')
    try {
      await api.post(`/rooms/${code}/start`)
      goToBattle()
    } catch (err) {
      const status = err.response?.status
      const data   = err.response?.data
      if (status === 409 && data?.status === 'active') {
        goToBattle(); return
      }
      setError(data?.message ?? 'Gagal mulai game.')
      setStarting(false)
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(code).catch(() => {})
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--nb-yellow)' }}>
        <div className="nb-card p-8 text-center">
          <div className="text-3xl mb-3">⏳</div>
          <p className="font-bold">Loading room...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--nb-blue)' }}>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <button className="nb-btn-white text-sm" onClick={() => navigate('/home')}>← Keluar</button>
        <h1 className="absolute left-1/2 -translate-x-1/2 font-black text-2xl"> LOBBY</h1>
        <div />
      </div>

      {/* Room Code */}
      <div className="nb-card-yellow max-w-sm mx-auto mb-6 p-5 text-center">
        <p className="font-bold text-sm mb-1">Kode Room</p>
        <div className="text-4xl md:text-5xl font-black tracking-widest mb-3 font-mono">
          {code}
        </div>
        <button className="nb-btn-black text-sm w-full" onClick={copyCode}>
          📋 Copy Kode
        </button>
        <p className="text-xs mt-2 text-gray-700">Bagikan ke teman buat join!</p>
      </div>

      {/* Participants */}
      <div className="max-w-md mx-auto">
        <div className="nb-card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-lg">Peserta ({participants.length})</h2>
            <span className="nb-badge" style={{ background: 'var(--nb-green)' }}>
              {participants.length} orang
            </span>
          </div>

          <div className="space-y-3">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 border-2 border-black"
                style={{ background: '#fafafa' }}>
                <img
                  src={p.photo_url || `/storage/${p.photo_path}`}
                  alt={p.name}
                  className="w-10 h-10 object-cover border-2 border-black"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <span className="font-bold flex-1">{p.name}</span>
                {p.is_host && (
                  <span className="nb-badge" style={{ background: 'var(--nb-yellow)' }}>👑 HOST</span>
                )}
              </div>
            ))}
          </div>

          {participants.length === 0 && (
            <p className="text-center text-gray-400 py-4 font-medium">Belum ada peserta...</p>
          )}
        </div>

        {error && (
          <div className="nb-card p-4 mb-4" style={{ background: '#fee2e2', borderColor: 'red' }}>
            <p className="font-bold text-red-700 text-sm">⚠️ {error}</p>
          </div>
        )}

        {isHost ? (
          <div className="nb-card-green p-5 text-center">
            <p className="font-bold mb-1 text-sm">Kamu adalah HOST 👑</p>
            <p className="text-xs text-gray-700 mb-4">
              Klik start kalau semua sudah siap.
            </p>
            <button
              className="nb-btn-black w-full text-lg"
              onClick={startGame}
              disabled={starting || participants.length < 1}
            >
              {starting ? '⏳ Memulai...' : '🚀 Mulai Battle!'}
            </button>
          </div>
        ) : (
          <div className="nb-card p-5 text-center">
            <div className="text-3xl mb-2">⏳</div>
            <p className="font-bold">Menunggu host memulai game...</p>
            <p className="text-sm text-gray-500 mt-1">Otomatis masuk saat battle dimulai.</p>
          </div>
        )}
      </div>
    </div>
  )
}
