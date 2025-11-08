import React from 'react';
import { Navigate } from 'react-router-dom';

// Checks for a valid access token in localStorage
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('sm_token');
  const _prDebugForce = (typeof window !== 'undefined' && window.location.search && window.location.search.indexOf('debug=1') !== -1)
  if (process.env.NODE_ENV !== 'production' || _prDebugForce) {
    try { console.debug('ProtectedRoute debug - token present:', !!token) } catch (e) {}
  }
  if (!token) {
    if (process.env.NODE_ENV !== 'production' || _prDebugForce) {
      try { console.warn('ProtectedRoute redirecting to /login because sm_token is missing') } catch (e) {}
    }
    return <Navigate to="/login" replace />;
  }
  return children;
}
