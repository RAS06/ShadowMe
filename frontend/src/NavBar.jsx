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

  return (
    <nav style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/">Home</Link>
  {/* show doctor link only for doctor role */}
  {user && user.role === 'doctor' && <Link to="/doctor">Doctor</Link>}
  {/* show student link only for student role */}
  {user && user.role === 'student' && <Link to="/student">Student</Link>}
      <button onClick={() => {
        // confirm to avoid accidental logout (e.g., clicking near links)
        if (!window.confirm('Log out?')) return;
        onLogout && onLogout();
        navigate('/login');
      }} style={{ marginLeft: 'auto' }}>
        Log out
      </button>
    </nav>
  );
}
