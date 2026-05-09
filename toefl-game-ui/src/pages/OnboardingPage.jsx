import { useRef, useState, useEffect, useCallback } from 'react'
import * as faceapi from 'face-api.js'
import api from '../lib/api'

const MODELS_URL = '/models'

export default function OnboardingPage({ onRegistered }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [step, setStep] = useState('intro')   // intro | camera | preview | form | submitting
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [detectionLoop, setDetectionLoop] = useState(null)

  useEffect(() => {
    faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL)
      .then(() => setModelsLoaded(true))
      .catch(() => setError('Gagal load model deteksi wajah. Cek koneksi internet.'))
  }, [])

  const startCamera = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      })
      streamRef.current = stream
      // If video element already rendered (retake), attach directly.
      // Otherwise setStep triggers useEffect to attach after render.
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }
      setStep('camera')
    } catch {
      setError('Akses kamera ditolak. Izinkan akses kamera di browser kamu.')
    }
  }, [])

  // Attach stream to video element after it renders
  useEffect(() => {
    if (step !== 'camera' || !streamRef.current || !videoRef.current) return
    videoRef.current.srcObject = streamRef.current
    videoRef.current.play().catch(() => {})
  }, [step])

  const stopCamera = useCallback(() => {
    if (detectionLoop) clearInterval(detectionLoop)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [detectionLoop])

  useEffect(() => {
    if (step !== 'camera' || !modelsLoaded) return

    let running = false

    const loop = setInterval(async () => {
      if (running || !videoRef.current || videoRef.current.readyState < 2) return
      running = true
      try {
        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 })
        )
        setFaceDetected(!!detection)

        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        if (detection) {
          const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true)
          faceapi.draw.drawDetections(canvasRef.current, faceapi.resizeResults(detection, dims))
        }
      } finally {
        running = false
      }
    }, 250)

    setDetectionLoop(loop)
    return () => clearInterval(loop)
  }, [step, modelsLoaded])

  function capture() {
    if (!faceDetected) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCapturedImage(dataUrl)
    stopCamera()
    setStep('preview')
  }

  function retake() {
    setCapturedImage(null)
    setStep('camera')
    setTimeout(startCamera, 100)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Nama harus diisi!'); return }
    if (!capturedImage) { setError('Foto selfie wajib ada!'); return }

    setStep('submitting')
    setError('')

    try {
      const res = await api.post('/players/register', {
        name: name.trim(),
        photo: capturedImage,
      })
      localStorage.setItem('player_token', res.data.session_token)
      onRegistered(res.data.player)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Gagal registrasi. Coba lagi.')
      setStep('preview')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'var(--nb-yellow)' }}>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-2"></div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight border-b-4 border-black pb-2">
          TOEFL BATTLE
        </h1>
        <p className="font-semibold text-lg mt-2">Uji Grammar kamu vs semua orang!</p>
      </div>

      <div className="nb-card w-full max-w-md p-6">

        {/* STEP: INTRO */}
        {step === 'intro' && (
          <div className="text-center">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-2xl font-black mb-2">Selfie Dulu!</h2>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Kita butuh foto muka kamu buat profil di battle.
              Wajah harus kedeteksi ya, baru bisa lanjut!
            </p>

            <div className="space-y-3 text-left mb-6">
              {['Pastikan pencahayaan cukup', 'Arahkan wajah ke kamera', 'Jangan pake masker / tutup wajah'].map((tip, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <span className="nb-badge" style={{ background: 'var(--nb-green)' }}>{i + 1}</span>
                  <span className="font-medium text-sm">{tip}</span>
                </div>
              ))}
            </div>

            {error && <p className="text-red-600 font-bold mb-4 text-sm">{error}</p>}

            <button
              className="nb-btn-black w-full text-lg"
              onClick={() => { setStep('loading-models') ; startCamera() }}
              disabled={!modelsLoaded}
            >
              {modelsLoaded ? '📷 Buka Kamera' : '⏳ Memuat model...'}
            </button>
          </div>
        )}

        {/* STEP: CAMERA */}
        {step === 'camera' && (
          <div>
            <h2 className="text-xl font-black mb-4 text-center">
              {faceDetected ? '✅ Wajah terdeteksi!' : '🔍 Cari wajah kamu...'}
            </h2>

            <div className="relative border-2 border-black overflow-hidden mb-4"
              style={{ aspectRatio: '4/3' }}>
              <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]"
                playsInline muted autoPlay />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full scale-x-[-1]" />
              <div
                className="absolute inset-0 border-4 transition-colors duration-300 pointer-events-none"
                style={{ borderColor: faceDetected ? 'var(--nb-green)' : 'var(--nb-pink)' }}
              />
            </div>

            <p className="text-center text-sm text-gray-500 mb-4">
              {faceDetected
                ? 'Mantap! Tekan tombol capture sekarang.'
                : 'Posisikan wajah kamu di tengah kamera.'}
            </p>

            <button
              className="w-full nb-btn text-lg mb-2"
              style={{
                background: faceDetected ? 'var(--nb-green)' : '#ccc',
                cursor: faceDetected ? 'pointer' : 'not-allowed',
                boxShadow: faceDetected ? 'var(--nb-shadow)' : 'none',
              }}
              onClick={capture}
              disabled={!faceDetected}
            >
              📸 Capture!
            </button>

            <button className="w-full nb-btn-white text-sm"
              onClick={() => { stopCamera(); setStep('intro') }}>
              ← Kembali
            </button>
          </div>
        )}

        {/* STEP: PREVIEW + FORM */}
        {(step === 'preview' || step === 'submitting') && (
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-black mb-4 text-center">Kece! Isi nama kamu 👇</h2>

            <div className="relative mb-4 border-2 border-black overflow-hidden"
              style={{ aspectRatio: '4/3' }}>
              <img src={capturedImage} alt="Selfie preview"
                className="w-full h-full object-cover scale-x-[-1]" />
              <div className="absolute bottom-2 right-2">
                <span className="nb-badge" style={{ background: 'var(--nb-green)' }}>✓ Wajah OK</span>
              </div>
            </div>

            <button type="button" className="nb-btn-white text-xs w-full mb-4"
              onClick={retake}>
              🔄 Ulangi Foto
            </button>

            <label className="block font-bold mb-1 text-sm">Nama Kamu</label>
            <input
              type="text"
              className="nb-input mb-1"
              placeholder="cth: Budi Santoso"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
              disabled={step === 'submitting'}
              required
            />
            <p className="text-xs text-gray-500 mb-4">{name.length}/30 karakter</p>

            {error && <p className="text-red-600 font-bold mb-3 text-sm">{error}</p>}

            <button
              type="submit"
              className="nb-btn-black w-full text-lg"
              disabled={step === 'submitting'}
            >
              {step === 'submitting' ? '⏳ Mendaftar...' : '🚀 Daftar & Main!'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
