import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

const MEDAL = ['🥇', '🥈', '🥉']
const RANK_BG = ['var(--nb-yellow)', '#d1d5db', '#cd7f32']

export default function ScorePage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [scores, setScores] = useState([])
  const [totalQ, setTotalQ] = useState(20)
  const [loading, setLoading] = useState(true)

  const myId = (() => {
    try {
      const token = localStorage.getItem('player_token')
      return token ? null : null
    } catch { return null }
  })()

  useEffect(() => {
    api.get(`/games/${gameId}/scores`)
      .then(res => {
        setScores(res.data.scores)
        setTotalQ(res.data.total_questions)
      })
      .catch(() => navigate('/home'))
      .finally(() => setLoading(false))
  }, [gameId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--nb-yellow)' }}>
        <div className="nb-card p-8 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <p className="font-black text-xl">Menghitung skor...</p>
        </div>
      </div>
    )
  }

  const top = scores.slice(0, 3)
  const rest = scores.slice(3)

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--nb-black)' }}>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-2">🏆</div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-1">HASIL BATTLE</h1>
        <p className="text-gray-400 font-medium">Total {totalQ} soal Grammar TOEFL</p>
      </div>

      {/* Podium top 3 */}
      {top.length > 0 && (
        <div className="max-w-md mx-auto mb-8">
          <div className="flex items-end justify-center gap-2 mb-6">
            {/* 2nd place (left) */}
            {top[1] && (
              <div className="flex flex-col items-center flex-1">
                <img
                  src={top[1].player_photo}
                  alt={top[1].player_name}
                  className="w-14 h-14 object-cover border-2 border-black mb-2"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="nb-card w-full text-center py-4 px-2" style={{ background: '#d1d5db' }}>
                  <div className="text-2xl mb-1">🥈</div>
                  <p className="font-black text-sm truncate">{top[1].player_name}</p>
                  <p className="font-black text-xl">{top[1].score}</p>
                  <p className="text-xs text-gray-600">{top[1].correct_count}/{totalQ} benar</p>
                </div>
              </div>
            )}

            {/* 1st place (center, tallest) */}
            {top[0] && (
              <div className="flex flex-col items-center flex-1">
                <img
                  src={top[0].player_photo}
                  alt={top[0].player_name}
                  className="w-16 h-16 object-cover border-4 border-black mb-2"
                  style={{ transform: 'scaleX(-1)', boxShadow: '4px 4px 0 black' }}
                />
                <div className="nb-card-yellow w-full text-center py-6 px-2">
                  <div className="text-3xl mb-1">🥇</div>
                  <p className="font-black truncate">{top[0].player_name}</p>
                  <p className="font-black text-2xl">{top[0].score}</p>
                  <p className="text-xs text-gray-700">{top[0].correct_count}/{totalQ} benar</p>
                </div>
              </div>
            )}

            {/* 3rd place (right) */}
            {top[2] && (
              <div className="flex flex-col items-center flex-1">
                <img
                  src={top[2].player_photo}
                  alt={top[2].player_name}
                  className="w-12 h-12 object-cover border-2 border-black mb-2"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <div className="nb-card w-full text-center py-3 px-2" style={{ background: '#cd7f32', color: 'white' }}>
                  <div className="text-xl mb-1">🥉</div>
                  <p className="font-black text-xs truncate">{top[2].player_name}</p>
                  <p className="font-black text-lg">{top[2].score}</p>
                  <p className="text-xs">{top[2].correct_count}/{totalQ}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <div className="max-w-md mx-auto mb-8">
          <div className="nb-card p-4">
            <h3 className="font-black mb-3 text-base">Peringkat Lainnya</h3>
            <div className="space-y-2">
              {rest.map((s) => (
                <div key={s.player_id} className="flex items-center gap-3 p-3 border-2 border-black"
                  style={{ background: '#f9f9f9' }}>
                  <span className="font-black text-lg w-8 text-center">{s.rank}</span>
                  <img
                    src={s.player_photo}
                    alt={s.player_name}
                    className="w-9 h-9 object-cover border-2 border-black"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <span className="font-bold flex-1 truncate">{s.player_name}</span>
                  <div className="text-right">
                    <p className="font-black">{s.score} pts</p>
                    <p className="text-xs text-gray-500">{s.correct_count}/{totalQ}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="max-w-md mx-auto space-y-3">
        <button className="nb-btn-yellow w-full text-base font-black"
          onClick={() => navigate('/home')}>
          🏠 Balik ke Home
        </button>
        <p className="text-center text-gray-500 text-xs">
          Skor dihitung dari jumlah jawaban benar × 5 poin
        </p>
      </div>
    </div>
  )
}
