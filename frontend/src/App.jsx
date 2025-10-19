import React, { useEffect, useState } from 'react'

export default function App() {
  const [ping, setPing] = useState(null)

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '/api') + '/ping')
      .then(r => r.json())
      .then(setPing)
      .catch(() => setPing({ ok: false }))
  }, [])

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: 24 }}>
      <h1>ShadowMe Frontend</h1>
      <p>This is a minimal React + Vite app served from the frontend service.</p>
      <p>Here I have updated the page that is served. </p>
      <p>Updated Again</p>
      <pre>{JSON.stringify(ping, null, 2)}</pre>
    </div>
  )
}
