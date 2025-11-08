import React, { useEffect, useRef, useState } from 'react'

// Lightweight Leaflet-based map picker. Leaflet CSS/JS are loaded via CDN in this component.
// Returns onChange with { lat, lng } when user clicks on map. Shows a movable marker.

export default function MapPicker({ value, onChange }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (loaded) return
    // load CSS
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    css.crossOrigin = ''
    document.head.appendChild(css)
    // load script
    const s = document.createElement('script')
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    s.onload = () => {
      setLoaded(true)
      initMap()
    }
    document.body.appendChild(s)

    return () => {
      // don't remove scripts/css to avoid flicker if reused
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function initMap() {
    if (!window.L) return
    const L = window.L
    const el = containerRef.current
    if (!el) return
    mapRef.current = L.map(el).setView([value?.lat || 37.7749, value?.lng || -122.4194], 12)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapRef.current)

    markerRef.current = L.marker([value?.lat || 37.7749, value?.lng || -122.4194], { draggable: true }).addTo(mapRef.current)

    mapRef.current.on('click', (e) => {
      const { lat, lng } = e.latlng
      markerRef.current.setLatLng([lat, lng])
      onChange && onChange({ lat, lng })
    })

    markerRef.current.on('dragend', () => {
      const pos = markerRef.current.getLatLng()
      onChange && onChange({ lat: pos.lat, lng: pos.lng })
    })
  }

  useEffect(() => {
    if (!mapRef.current) return
    const pos = [value?.lat || 37.7749, value?.lng || -122.4194]
    markerRef.current.setLatLng(pos)
    mapRef.current.setView(pos)
  }, [value])

  return (
    <div style={{ height: 300, width: '100%' }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
