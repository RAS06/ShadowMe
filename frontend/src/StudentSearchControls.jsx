import React, { useState } from 'react'

export default function StudentSearchControls({ onSearch, initial }) {
  const [address, setAddress] = useState(initial?.address || '')
  const [lat, setLat] = useState(initial?.lat || '')
  const [lng, setLng] = useState(initial?.lng || '')
  // radius is stored in kilometers in the UI
  const [radius, setRadius] = useState(initial?.radius || 5)

  return (
    <div style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12 }}>
      <div>
        <label>Address: <input style={{ width: '60%' }} value={address} onChange={e => setAddress(e.target.value)} /></label>
        <button onClick={() => onSearch({ address, lat, lng, radius })} style={{ marginLeft: 8 }}>Search</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <label>Lat: <input value={lat} onChange={e => setLat(e.target.value)} /></label>
        <label style={{ marginLeft: 12 }}>Lng: <input value={lng} onChange={e => setLng(e.target.value)} /></label>
  <label style={{ marginLeft: 12 }}>Radius (km): <input value={radius} onChange={e => setRadius(Number(e.target.value))} /></label>
      </div>
    </div>
  )
}
