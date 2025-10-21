import React from 'react';
import NavBar from './NavBar';

export default function Dashboard() {
  function handleLogout() {
    localStorage.removeItem('sm_token');
    localStorage.removeItem('sm_user');
    // Optionally: call /api/auth/revoke here
  }
  return (
    <div style={{ padding: 24 }}>
      <NavBar onLogout={handleLogout} />
      <h2>Dashboard</h2>
      <p>Welcome to your dashboard! Only logged-in users can see this page.</p>
    </div>
  );
}
