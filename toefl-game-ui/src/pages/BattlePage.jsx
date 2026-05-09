import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'

const QUESTION_TIME  = 30
const COUNTDOWN_START = 5

const RULES = [
  { icon: '🚫', text: 'Dilarang pakai AI (ChatGPT, Gemini, dll)' },
  { icon: '🚫', text: 'Dilarang googling jawaban' },
  { icon: '🚫', text: 'Dilarang minta jawaban ke orang lain' },
  { icon: '⏱️', text: 'Setiap soal punya waktu 30 detik' },
  { icon: '✅', text: 'Jawab sendiri, buktiin kemampuan kamu!' },
]

export default function BattlePage() {
  const { code } = useParams()
  const navigate = useNavigate()

  const [gameData, setGameData]             = useState(null)
  const [questions, setQuestions]           = useState([])
  const [currentIndex, setCurrentIndex]     = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answerResult, setAnswerResult]     = useState(null)
  const [timeLeft, setTimeLeft]             = useState(QUESTION_TIME)
  const [finished, setFinished]             = useState(false)
  const [isHost, setIsHost]                 = useState(false)
  const [submitting, setSubmitting]         = useState(false)
  const [loadError, setLoadError]           = useState('')
  const [questionStatus, setQuestionStatus] = useState(null)
  const [countdown, setCountdown]           = useState(null) // null = belum mulai, 5..1 = hitung mundur, 0 = mulai

  const timerRef        = useRef(null)
  const finishCalledRef = useRef(false)
  const advancedRef     = useRef(false)

  // Fetch room info + game data
  useEffect(() => {
    async function init() {
      try {
        const roomRes = await api.get(`/rooms/${code}`)
        const { room, is_host } = roomRes.data
        setIsHost(is_host)

        if (room.status === 'finished') {
          const gameRes = await api.get(`/rooms/${code}/game`).catch(() => null)
          navigate(gameRes?.data?.game_id ? `/score/${gameRes.data.game_id}` : '/home', { replace: true })
          return
        }
        if (room.status !== 'active') {
          navigate(`/room/${code}`, { replace: true })
          return
        }

        const gameRes = await api.get(`/rooms/${code}/game`)
        setGameData(gameRes.data)
      } catch {
        setLoadError('Gagal memuat soal. Coba refresh halaman.')
      }
    }
    init()
  }, [code])

  // Polling — cek kalau game sudah selesai
  useEffect(() => {
    if (!gameData) return
    const poll = setInterval(async () => {
      try {
        const res = await api.get(`/rooms/${code}`)
        if (res.data.room.status === 'finished') {
          clearInterval(poll)
          navigate(`/score/${gameData.game_id}`, { replace: true })
        }
      } catch { /* ignore */ }
    }, 3000)
    return () => clearInterval(poll)
  }, [gameData, code])

  // Parse & sort questions, lalu mulai countdown
  useEffect(() => {
    if (!gameData?.questions?.length) return
    const qs = [...gameData.questions].sort((a, b) => a.order - b.order)
    setQuestions(qs)
    setCountdown(COUNTDOWN_START)
  }, [gameData])

  // Countdown sebelum soal pertama
  useEffect(() => {
    if (countdown === null || countdown === 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const advanceQuestion = useCallback(() => {
    advancedRef.current = true
    setCurrentIndex(prev => {
      if (prev >= questions.length - 1) {
        setFinished(true)
        return prev
      }
      return prev + 1
    })
  }, [questions.length])

  // Timer per soal — hanya jalan setelah countdown selesai
  useEffect(() => {
    if (!questions.length || finished || countdown !== 0) return

    // Reset state untuk soal baru
    advancedRef.current = false
    setTimeLeft(QUESTION_TIME)
    setSelectedAnswer(null)
    setAnswerResult(null)
    setQuestionStatus(null)

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          // Timer habis → paksa next soal, ga nunggu semua jawab
          if (!advancedRef.current) {
            advancedRef.current = true
            advanceQuestion()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [currentIndex, questions.length])

  // Poll status jawaban setelah player submit — cek apakah semua sudah jawab
  useEffect(() => {
    if (!selectedAnswer || !gameData || !questions.length) return
    const question = questions[currentIndex]
    if (!question) return

    let cancelled = false

    async function checkStatus() {
      try {
        const res = await api.get(`/games/${gameData.game_id}/questions/${question.id}/status`)
        if (cancelled) return
        setQuestionStatus(res.data)
        if (res.data.all_answered && !advancedRef.current) {
          advancedRef.current = true
          setTimeout(advanceQuestion, 800)
        }
      } catch { /* ignore */ }
    }

    checkStatus() // cek langsung (mungkin solo, langsung lanjut)
    const poll = setInterval(checkStatus, 2000)

    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [selectedAnswer, currentIndex, gameData])

  useEffect(() => {
    if (!finished || !isHost || finishCalledRef.current) return
    finishCalledRef.current = true
    setTimeout(() => {
      api.post(`/rooms/${code}/finish`)
        .then(res => navigate(`/score/${res.data.game_id}`, { replace: true }))
        .catch(() => navigate('/home'))
    }, 1500)
  }, [finished, isHost, code])

  async function handleAnswer(option) {
    if (selectedAnswer || !gameData) return
    const question = questions[currentIndex]
    setSelectedAnswer(option)
    clearInterval(timerRef.current)
    setSubmitting(true)

    try {
      const res = await api.post(`/games/${gameData.game_id}/answer`, {
        question_id: question.id,
        answer: option,
      })
      setAnswerResult(res.data.is_correct ? 'correct' : 'wrong')
    } catch {
      setAnswerResult('wrong')
    } finally {
      setSubmitting(false)
    }
    // Tidak langsung advanceQuestion — tunggu semua jawab atau timer habis
  }

  const timerPct   = (timeLeft / QUESTION_TIME) * 100
  const timerColor = timerPct > 50 ? 'var(--nb-green)' : timerPct > 25 ? 'var(--nb-yellow)' : 'var(--nb-pink)'

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--nb-black)' }}>
        <div className="nb-card p-8 text-center max-w-sm">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="font-black text-xl mb-3">{loadError}</p>
          <button className="nb-btn-yellow w-full" onClick={() => window.location.reload()}>🔄 Refresh</button>
        </div>
      </div>
    )
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--nb-black)' }}>
        <div className="nb-card p-8 text-center max-w-sm">
          <div className="text-4xl mb-3 animate-spin"></div>
          <p className="font-black text-xl mb-1">Battle sedang dimulai!</p>
          <p className="text-sm text-gray-500">Soal sedang disiapkan...</p>
        </div>
      </div>
    )
  }

  // Countdown + rules screen
  if (countdown !== 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'var(--nb-black)' }}>

        {/* Countdown angka */}
        <div className="nb-card-yellow w-28 h-28 flex items-center justify-center mb-8"
          style={{ boxShadow: '6px 6px 0 white' }}>
          <span className="text-6xl font-black" style={{ lineHeight: 1 }}>
            {countdown}
          </span>
        </div>

        <h2 className="text-white font-black text-2xl mb-2 text-center"> Battle dimulai dalam {countdown}...</h2>
        <p className="text-gray-400 text-sm mb-8 text-center">Baca dulu aturannya ya!</p>

        {/* Rules */}
        <div className="w-full max-w-sm space-y-3">
          {RULES.map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border-2 border-gray-700"
              style={{ background: '#1a1a1a' }}>
              <span className="text-xl">{r.icon}</span>
              <span className="text-white font-medium text-sm">{r.text}</span>
            </div>
          ))}
        </div>

        <p className="text-gray-600 text-xs mt-8">
          {questions.length} soal · 30 detik per soal
        </p>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--nb-black)' }}>
        <div className="nb-card-yellow p-8 text-center max-w-sm">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-black mb-2">Selesai!</h2>
          <p className="font-medium">Menghitung skor semua pemain...</p>
        </div>
      </div>
    )
  }

  const question    = questions[currentIndex]
  if (!question) return null

  const optionColors = { A: 'var(--nb-yellow)', B: 'var(--nb-blue)', C: 'var(--nb-green)', D: 'var(--nb-pink)' }
  const allAnswered  = questionStatus?.all_answered

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--nb-black)' }}>

      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b-2 border-gray-700">
        <span className="font-black text-white text-lg"> BATTLE</span>
        <span className="nb-badge" style={{ background: 'var(--nb-yellow)' }}>
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Timer */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white font-bold text-sm">Waktu</span>
          <span className={`text-2xl font-black ${timeLeft <= 10 && !selectedAnswer ? 'timer-pulse' : ''}`}
            style={{ color: selectedAnswer ? '#555' : timerColor }}>
            {selectedAnswer ? '—' : `${timeLeft}s`}
          </span>
        </div>
        <div className="w-full h-4 border-2 border-white bg-gray-800">
          <div className="h-full transition-all duration-1000"
            style={{ width: `${selectedAnswer ? timerPct : timerPct}%`, background: selectedAnswer ? '#444' : timerColor }} />
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col">
        {/* Soal */}
        <div className="nb-card p-5 mb-4">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Soal #{currentIndex + 1}</p>
          <p className="text-base md:text-lg font-bold leading-relaxed">{question.question}</p>
        </div>

        {/* Hasil jawaban */}
        {answerResult && (
          <div className={`nb-card p-3 mb-4 text-center font-black text-lg ${answerResult === 'wrong' ? 'shake' : ''}`}
            style={{ background: answerResult === 'correct' ? 'var(--nb-green)' : 'var(--nb-pink)' }}>
            {answerResult === 'correct' ? '✅ Benar!' : '❌ Salah!'}
          </div>
        )}

        {/* Pilihan jawaban */}
        {!selectedAnswer && (
          <div className="grid grid-cols-1 gap-3 mb-4">
            {Object.entries(question.options).map(([key, value]) => (
              <button key={key}
                onClick={() => handleAnswer(key)}
                disabled={submitting}
                className="nb-btn text-left text-sm md:text-base"
                style={{ background: optionColors[key], borderColor: '#000', boxShadow: 'var(--nb-shadow)' }}>
                <span className="font-black mr-3 text-lg">{key}</span>
                <span className="font-medium flex-1">{value}</span>
              </button>
            ))}
          </div>
        )}

        {/* Jawaban yang dipilih (readonly) */}
        {selectedAnswer && (
          <div className="grid grid-cols-1 gap-3 mb-4">
            {Object.entries(question.options).map(([key, value]) => {
              const isSelected = selectedAnswer === key
              return (
                <div key={key}
                  className="nb-btn text-left text-sm md:text-base"
                  style={{
                    background: isSelected ? optionColors[key] : '#2a2a2a',
                    borderColor: isSelected ? '#000' : '#444',
                    boxShadow: isSelected ? 'var(--nb-shadow)' : 'none',
                    color: isSelected ? '#000' : '#888',
                    cursor: 'default',
                  }}>
                  <span className="font-black mr-3 text-lg">{key}</span>
                  <span className="font-medium flex-1">{value}</span>
                  {isSelected && <span className="ml-2">{answerResult === 'correct' ? '✅' : '❌'}</span>}
                </div>
              )
            })}
          </div>
        )}

        {/* Waiting for players panel */}
        {selectedAnswer && (
          <div className="nb-card p-4 mb-4" style={{ background: '#1a1a1a', borderColor: '#333' }}>
            {allAnswered ? (
              <p className="text-center font-black text-white mb-3">
                ✅ Semua sudah menjawab! Lanjut...
              </p>
            ) : (
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="text-white font-black">
                  Menunggu pemain lain...
                </div>
                <span className="nb-badge" style={{ background: 'var(--nb-yellow)' }}>
                  {questionStatus ? `${questionStatus.answered_count}/${questionStatus.total_count}` : '...'}
                </span>
              </div>
            )}

            {questionStatus?.participants && (
              <div className="flex flex-wrap justify-center gap-3">
                {questionStatus.participants.map(p => (
                  <div key={p.id} className="flex flex-col items-center gap-1">
                    <div className="relative">
                      <img
                        src={p.photo_url}
                        alt={p.name}
                        className="w-12 h-12 object-cover border-2"
                        style={{
                          transform: 'scaleX(-1)',
                          borderColor: p.has_answered ? 'var(--nb-green)' : '#555',
                        }}
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-5 h-5 flex items-center justify-center border border-black text-xs font-black"
                        style={{ background: p.has_answered ? 'var(--nb-green)' : '#333', color: p.has_answered ? '#000' : '#888' }}>
                        {p.has_answered ? '✓' : '…'}
                      </div>
                    </div>
                    <span className="text-xs font-bold max-w-16 text-center truncate"
                      style={{ color: p.has_answered ? 'var(--nb-green)' : '#666' }}>
                      {p.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!questionStatus && (
              <div className="flex justify-center">
                <div className="text-gray-500 text-sm">Mengecek status...</div>
              </div>
            )}
          </div>
        )}

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-auto pt-2">
          {questions.map((_, i) => (
            <div key={i} className="w-2 h-2 border border-gray-600 rounded-full"
              style={{ background: i < currentIndex ? 'var(--nb-green)' : i === currentIndex ? 'white' : 'transparent' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
