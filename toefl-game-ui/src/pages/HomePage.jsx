import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { usePlayer } from '../lib/usePlayer'

export default function HomePage() {
  const navigate = useNavigate()
  const { player, logout } = usePlayer()
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function createRoom() {
    setLoading(true); setError('')
    try {
      const res = await api.post('/rooms')
      navigate(`/room/${res.data.room.code}`)
    } catch {
      setError('Gagal buat room. Coba lagi.')
    } finally { setLoading(false) }
  }

  async function joinRoom(e) {
    e.preventDefault()
    if (!joinCode.trim()) return
    setLoading(true); setError('')
    try {
      const res = await api.post(`/rooms/${joinCode.trim().toUpperCase()}/join`)
      navigate(`/room/${res.data.room.code}`)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Room tidak ditemukan atau sudah penuh.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--nb-yellow)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="text-3xl"></div>
          <span className="font-black text-2xl">TOEFL BATTLE</span>
        </div>
        <button className="nb-btn-white text-sm" onClick={logout}>Logout</button>
      </div>

      {/* Player card */}
      {player && (
        <div className="nb-card max-w-sm mb-8 p-4 flex items-center gap-4">
          <img
            src={player.photo_url}
            alt={player.name}
            className="w-14 h-14 object-cover border-2 border-black rounded-none"
            style={{ transform: 'scaleX(-1)' }}
          />
          <div>
            <p className="text-xs text-gray-500 font-medium">Halo, selamat datang!</p>
            <p className="font-black text-xl">{player.name}</p>
          </div>
        </div>
      )}

      <div className="max-w-md space-y-6">

        {/* Create Room */}
        <div className="nb-card-green p-6">
          <h2 className="text-2xl font-black mb-2">🏠 Buat Room</h2>
          <p className="text-sm font-medium mb-4">
            Kamu jadi host. Undang teman-teman dan mulai battle kapanpun kamu mau!
          </p>
          <button
            className="nb-btn-black w-full text-base"
            onClick={createRoom}
            disabled={loading}
          >
            {loading ? '⏳ Membuat...' : '+ Buat Room Baru'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t-2 border-black" />
          <span className="font-black text-lg">ATAU</span>
          <div className="flex-1 border-t-2 border-black" />
        </div>

        {/* Join Room */}
        <div className="nb-card p-6">
          <h2 className="text-2xl font-black mb-2">🚪 Join Room</h2>
          <p className="text-sm font-medium text-gray-600 mb-4">
            Masukkan kode 6 huruf dari teman kamu.
          </p>
          <form onSubmit={joinRoom} className="space-y-3">
            <input
              type="text"
              className="nb-input text-center text-2xl font-black tracking-widest uppercase"
              placeholder="XXXXXX"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              required
            />
            <button
              type="submit"
              className="nb-btn-pink w-full text-base font-black"
              disabled={loading || joinCode.length < 6}
            >
              {loading ? '⏳ Joining...' : '→ Join Battle!'}
            </button>
          </form>
        </div>

        {error && (
          <div className="nb-card p-4 border-red-500" style={{ background: '#fee2e2' }}>
            <p className="font-bold text-red-700 text-sm">⚠️ {error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
