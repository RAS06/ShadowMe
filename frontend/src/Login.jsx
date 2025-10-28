import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function validateEmail(email) {
    // Simple email regex: must have @ and . after @, no spaces
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    const api = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    fetch(`${api}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(async res => {
      if (!res.ok) {
        let msg = 'Login failed'
        try {
          const data = await res.json()
          msg = data.error || msg
        } catch (e) {
          msg = await res.text()
        }
        setError(msg)
        return
      }
      const data = await res.json()
      localStorage.setItem('sm_token', data.token)
      localStorage.setItem('sm_user', JSON.stringify(data.user))
      navigate('/dashboard')
    }).catch(err => {
      console.error('Login error', err)
      setError('Login failed')
    })
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <h2>Log in</h2>
      {error && (
        <div style={{ color: 'crimson', margin: '12px 0', fontWeight: 500 }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Email
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            required
          />
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" style={{ padding: '8px 14px' }}>Sign in</button>
          <button type="button" onClick={() => navigate('/signup')} style={{ padding: '8px 14px' }}>Go to sign up</button>
        </div>
      </form>
    </div>
  )
}
