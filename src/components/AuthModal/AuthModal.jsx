import { useState } from 'react'
import { api } from '../../api/client'
import './AuthModal.css'

export default function AuthModal({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const res = await api.post(endpoint, { username, password })
      localStorage.setItem('motionise_token', res.token)
      localStorage.setItem('motionise_user', JSON.stringify(res.user))
      window.dispatchEvent(new Event('auth_changed'))
      if (onLogin) onLogin()
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <h2 className="auth-title">Motionise</h2>
        <p className="auth-subtitle">
          {isLogin ? 'Sign in to access your studio' : 'Create an account to start editing'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="auth-input"
          />
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? '...' : isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        <button className="auth-toggle" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
          {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  )
}
