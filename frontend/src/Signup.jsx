  function fullNameMeetsRequirements(name) {
    // At least two words, each at least 2 letters, only letters or hyphens (sync with backend)
    if (typeof name !== 'string') return false;
    // Regex: /^[A-Za-z-]{2,}(?: [A-Za-z-]{2,})+$/
    return /^[A-Za-z-]{2,}(?: [A-Za-z-]{2,})+$/.test(name.trim());
  }
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'



export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  function passwordMeetsRequirements(pw) {
    // At least 8 chars, 2 numbers, 2 special chars
    const special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g;
    const numbers = /[0-9]/g;
    return (
      typeof pw === 'string' &&
      pw.length >= 8 &&
      (pw.match(numbers) || []).length >= 2 &&
      (pw.match(special) || []).length >= 2
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!fullNameMeetsRequirements(name)) {
      setError('Full name must be at least two words and may contain only letters or hyphens.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!passwordMeetsRequirements(password)) {
      setError('Password must be at least 8 characters, contain at least 2 numbers and 2 special characters.');
      return;
    }
    const api = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    fetch(`${api}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: name, email, password })
    }).then(async res => {
      if (!res.ok) {
        let msg = 'Registration failed';
        try {
          const data = await res.json();
          msg = data.error || msg;
        } catch (e) {
          msg = await res.text();
        }
        setError(msg);
        return;
      }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1800);
    }).catch(err => {
      console.error('Registration error', err);
      setError('Registration failed');
    });
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <h2>Sign up</h2>
      {success ? (
        <div style={{ color: 'green', margin: '24px 0', fontWeight: 600 }}>
          Registration successful! Redirecting to login...
        </div>
      ) : (
        <React.Fragment>
          {error && (
            <div style={{ color: 'crimson', margin: '12px 0', fontWeight: 500 }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            <label>
              Full name
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: 8 }}
                required
              />
              <div style={{ fontSize: '0.95em', color: '#555', marginTop: 4 }}>
                Must be at least two words and may contain only letters or hyphens.
              </div>
            </label>
            <label>
              Email
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: 8 }}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: 8 }}
                required
              />
              <div style={{ fontSize: '0.95em', color: '#555', marginTop: 4 }}>
                Must be at least 8 characters, contain at least 2 numbers and 2 special characters.
              </div>
            </label>
            <label>
              Confirm password
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                style={{ width: '100%', padding: 8 }}
                required
              />
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{ padding: '8px 14px' }}>Sign up</button>
              <button type="button" onClick={() => navigate('/login')} style={{ padding: '8px 14px' }}>Go to login</button>
            </div>
          </form>
        </React.Fragment>
      )}
    </div>
  );
}
