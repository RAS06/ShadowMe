import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function App() {
  const navigate = useNavigate()

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>ShadowMe</h1>
      <p>This is the ShadowMe landing page. Use the buttons below to sign in or create a new account.</p>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button onClick={() => navigate('/login')} style={{ padding: '10px 18px', fontSize: 16 }}>Log in</button>
        <button onClick={() => navigate('/signup')} style={{ padding: '10px 18px', fontSize: 16 }}>Sign up</button>
      </div>
    </div>
  )
}
