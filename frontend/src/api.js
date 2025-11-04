// Small fetch wrapper that attaches Bearer token from localStorage and attempts a token refresh on 401.
export default async function api(path, options = {}) {
  // Prefer an explicit base passed in options, otherwise use VITE_API_URL (set in docker-compose)
  // Fallback to empty string for same-origin behavior in production builds served by backend.
  const base = options.base || import.meta.env.VITE_API_URL || ''
  const token = localStorage.getItem('sm_token')
  const headers = Object.assign({}, options.headers || {})
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(base + path, { ...options, headers })
  if (res.status !== 401) return res

  // Try to refresh token once
  try {
    const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
    if (!refreshRes.ok) return res
    const jr = await refreshRes.json()
    if (jr && jr.token) {
      localStorage.setItem('sm_token', jr.token)
      // retry original request with new token
      const retryHeaders = Object.assign({}, headers)
      retryHeaders['Authorization'] = `Bearer ${jr.token}`
      return fetch(base + path, { ...options, headers: retryHeaders })
    }
  } catch (err) {
    console.error('Refresh attempt failed', err)
  }

  return res
}
