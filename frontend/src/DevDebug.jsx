import React, { useEffect, useState } from 'react'

export default function DevDebug() {
  const [token, setToken] = useState(localStorage.getItem('sm_token'))
  const [rawUser, setRawUser] = useState(localStorage.getItem('sm_user'))

  useEffect(() => {
    function onStorage() {
      setToken(localStorage.getItem('sm_token'))
      setRawUser(localStorage.getItem('sm_user'))
    }
    window.addEventListener('storage', onStorage)
    // also poll every second for same-tab changes (storage event isn't fired in same tab)
    const iv = setInterval(onStorage, 1000)
    return () => { window.removeEventListener('storage', onStorage); clearInterval(iv) }
  }, [])

  let parsed = null
  try { parsed = rawUser ? JSON.parse(rawUser) : null } catch (e) { parsed = { parseError: e.message } }

  const _force = (typeof window !== 'undefined' && window.location.search && window.location.search.indexOf('debug=1') !== -1)
  // only render in development builds or when ?debug=1 is present
  if (process.env.NODE_ENV === 'production' && !_force) return null

  return (
    <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999, background: 'rgba(0,0,0,0.8)', color: 'white', padding: 12, borderRadius: 8, fontSize: 12, width: 320 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 6 }}>DEV DEBUG</div>
      <div style={{ marginBottom: 6 }}>token present: {token ? 'yes' : 'no'}</div>
      <div style={{ marginBottom: 6 }}>token (first 40 chars): {token ? token.slice(0,40) + (token.length>40? '…':'') : '(none)'} </div>
      <div style={{ marginBottom: 6 }}>raw sm_user: {rawUser ? rawUser.slice(0,120) : '(none)'}</div>
      <div style={{ marginBottom: 6 }}>parsed: <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(parsed, null, 2)}</pre></div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => { localStorage.removeItem('sm_token'); localStorage.removeItem('sm_user'); window.location.reload() }} style={{ background: '#b22222', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 4 }}>Force clear (dev)</button>
      </div>
    </div>
  )
}
