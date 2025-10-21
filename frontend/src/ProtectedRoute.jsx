import React from 'react';
import { Navigate } from 'react-router-dom';

// Checks for a valid access token in localStorage
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('sm_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
