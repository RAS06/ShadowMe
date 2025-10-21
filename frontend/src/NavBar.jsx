import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function NavBar({ onLogout }) {
  const navigate = useNavigate();
  return (
    <nav style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/">Home</Link>
      <button onClick={() => { onLogout && onLogout(); navigate('/login'); }} style={{ marginLeft: 'auto' }}>
        Log out
      </button>
    </nav>
  );
}
