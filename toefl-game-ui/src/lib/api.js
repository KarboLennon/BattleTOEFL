import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('player_token')
  if (token) config.headers['X-Player-Token'] = token
  return config
})

// Jika token sudah tidak valid (player dihapus / DB reset), clear dan redirect ke onboarding
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status

    if (status === 401) {
      localStorage.removeItem('player_token')
      window.location.href = '/'
      return new Promise(() => {})
    }

    return Promise.reject(err)
  }
)

export default api
