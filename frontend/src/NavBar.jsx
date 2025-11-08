import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function NavBar({ onLogout }) {
  const navigate = useNavigate();
  // determine user role from localStorage (UI-only guard)
  let user = null
  try { user = JSON.parse(localStorage.getItem('sm_user') || 'null') } catch (e) { user = null }
  // fallback: decode token payload if sm_user missing
  if (!user) {
    try {
      const token = localStorage.getItem('sm_token')
      if (token) {
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]))
          user = { role: payload.role, profileId: payload.profileId, id: payload.sub, email: payload.email }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  const _navDebugForce = (typeof window !== 'undefined' && window.location.search && window.location.search.indexOf('debug=1') !== -1)
  if (process.env.NODE_ENV !== 'production' || _navDebugForce) {
    try {
      // show helpful debug info in dev or when ?debug=1 is present
      console.debug('NavBar debug - user:', user, 'tokenPresent:', !!localStorage.getItem('sm_token'), 'rawSmUser:', localStorage.getItem('sm_user'))
    } catch (e) {}
  }

  return (
    <nav className="app-nav">
      <div className="nav-inner">
        <div className="app-nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/">Home</Link>
          {user && user.role === 'doctor' && <Link to="/doctor" onClick={(e) => {
            try {
              const _force = (typeof window !== 'undefined' && window.location.search && window.location.search.indexOf('debug=1') !== -1)
              if (process.env.NODE_ENV !== 'production' || _force) console.debug('Nav click Doctor - tokenPresent:', !!localStorage.getItem('sm_token'), 'rawSmUser:', localStorage.getItem('sm_user'))
            } catch (e) {}
          }}>Doctor</Link>}
          {user && user.role === 'student' && <Link to="/student" onClick={(e) => {
            try {
              const _force = (typeof window !== 'undefined' && window.location.search && window.location.search.indexOf('debug=1') !== -1)
              if (process.env.NODE_ENV !== 'production' || _force) console.debug('Nav click Student - tokenPresent:', !!localStorage.getItem('sm_token'), 'rawSmUser:', localStorage.getItem('sm_user'))
            } catch (e) {}
          }}>Student</Link>}
        </div>
        <button onClick={() => {
          if (!window.confirm('Log out?')) return;
          onLogout && onLogout();
          navigate('/login');
        }} className="app-logout">Log out</button>
      </div>
    </nav>
  );
}
