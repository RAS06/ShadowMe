import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from './NavBar';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('sm_user') || '{}');
  const isDoctor = user.role === 'doctor';

  function handleLogout() {
    localStorage.removeItem('sm_token');
    localStorage.removeItem('sm_user');
    // Optionally: call /api/auth/revoke here
  }
  return (
    <div style={{ padding: 24 }}>
      <NavBar onLogout={handleLogout} />
      <h2>Dashboard</h2>
      <p>Welcome back, {user.fullName || 'User'}! {isDoctor && '(Doctor)'}</p>
      
      <div style={{ marginTop: 32 }}>
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <Link
            to="/appointments/book"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 4,
              fontWeight: 600
            }}
          >
            🩺 Request Shadowing
          </Link>
          {isDoctor && (
            <>
              <Link
                to="/appointments/create"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: 4,
                  fontWeight: 600
                }}
              >
                + Post Opportunity
              </Link>
              <Link
                to="/appointments/manage"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: 4,
                  fontWeight: 600
                }}
              >
                📋 Manage My Opportunities
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
