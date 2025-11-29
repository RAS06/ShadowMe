// Small fetch wrapper that attaches Bearer token from localStorage and attempts a token refresh on 401.
export default async function api(path, options = {}) {
  // Determine the absolute backend base URL. Priority:
  // 1. options.base (explicit override)
  // 2. import.meta.env.VITE_API_URL (set in env/docker-compose)
  // 3. Runtime default: same host as the frontend but port 3000 (dev server)
  // The goal: in all cases the frontend makes requests to the backend server (absolute URL).
  const explicitBase = options.base || import.meta.env.VITE_API_URL || ''
  let base = explicitBase || ''
  if (!base && (typeof window !== 'undefined')) {
    // Use same protocol/host as the current page, but force port 3000 (backend)
    base = `${window.location.protocol}//${window.location.hostname}:3000`
  }
  // Normalize base (remove trailing slash)
  if (base.endsWith('/')) base = base.slice(0, -1)
  const token = localStorage.getItem('sm_token')
  const headers = Object.assign({}, options.headers || {})
  if (token) headers['Authorization'] = `Bearer ${token}`

  // Build absolute URL for the request. If path is already absolute (starts with http), use it.
  const url = (/^https?:\/\//i).test(path) ? path : (path.startsWith('/') ? base + path : base + '/' + path)
  const res = await fetch(url, { ...options, headers })
  if (res.status !== 401) return res

  // Try to refresh token once
  try {
    const refreshUrl = base + '/api/auth/refresh'
    const refreshRes = await fetch(refreshUrl, { method: 'POST', credentials: 'include' })
    if (!refreshRes.ok) return res
    const jr = await refreshRes.json()
    if (jr && jr.token) {
      localStorage.setItem('sm_token', jr.token)
      // retry original request with new token
      const retryHeaders = Object.assign({}, headers)
      retryHeaders['Authorization'] = `Bearer ${jr.token}`
      return fetch(url, { ...options, headers: retryHeaders })
    }
  } catch (err) {
    console.error('Refresh attempt failed', err)
  }

  return res
}
