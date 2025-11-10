import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function NavBar({ onLogout }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('sm_user') || '{}');
  const isDoctor = user.role === 'doctor';

  return (
    <nav style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, borderBottom: '2px solid #e0e0e0', paddingBottom: 12 }}>
      <Link to="/dashboard" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 500 }}>Dashboard</Link>
      <Link to="/appointments/book" style={{ textDecoration: 'none', color: '#28a745', fontWeight: 500 }}>Request Shadowing</Link>
      {isDoctor && (
        <>
          <Link to="/appointments/create" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 500 }}>Post Opportunity</Link>
          <Link to="/appointments/manage" style={{ textDecoration: 'none', color: '#6f42c1', fontWeight: 500 }}>Manage Opportunities</Link>
        </>
      )}
      <button onClick={() => { onLogout && onLogout(); }} style={{ marginLeft: 'auto', padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>
        Log out
      </button>
    </nav>
  );
}
