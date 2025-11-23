import React, { useState } from 'react';
import NavBar from './NavBar';
import api from './api';

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const [challenge, setChallenge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [throwNow, setThrowNow] = useState(false);

  function handleLogout() {
    localStorage.removeItem('sm_token');
    localStorage.removeItem('sm_user');
    // Optionally: call /api/auth/revoke here
  }

  async function handleGenerate() {
    setError('');
    setChallenge('');
    setShowModal(true);
    setLoading(true);
    try {
      const res = await api.post('/ai/generateChallenge');
      // Accept either res.data.challenge or res.data.result or plain string
      const data = res?.data;
      let text = '';
      if (!data) {
        throw new Error('Empty response from server');
      }
      if (typeof data === 'string') text = data;
      else text = data.challenge || data.result || data.text || JSON.stringify(data);
      setChallenge(text);
    } catch (err) {
      console.error('AI generate error', err);
      if (err?.response) {
        const msg = err.response?.data?.error || err.response?.data?.message || `Server error (${err.response.status})`;
        setError(msg);
      } else if (err?.request) {
        setError('No response from server. Check your network or server status.');
      } else {
        setError(err.message || 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <NavBar onLogout={handleLogout} />
      <h2>Dashboard</h2>
      <p>Welcome to your dashboard! Only logged-in users can see this page.</p>

      <div style={{ marginTop: 18 }}>
        <button onClick={handleGenerate} disabled={loading} style={{ padding: '10px 14px', fontSize: 16 }}>
          {loading ? 'Generating...' : 'Generate AI Challenge'}
        </button>
        <button onClick={async () => {
          // Trigger backend test error
          try {
            await api.get('/sentry/test-error')
          } catch (e) {
            // expected to error; show modal with message
            setShowModal(true)
            setChallenge('Backend test error triggered (check Sentry).')
          }
        }} style={{ marginLeft: 8, padding: '10px 14px', fontSize: 16 }}>Trigger BE Sentry Error</button>
        <button onClick={() => setThrowNow(true)} style={{ marginLeft: 8, padding: '10px 14px', fontSize: 16 }}>Trigger FE Sentry Error</button>
      </div>

      <div style={{ marginTop: 28, borderTop: '1px solid #ddd', paddingTop: 18 }}>
        <h3>Submit Work for AI Feedback</h3>
        <p style={{ marginTop: 6 }}>Upload a file (code or text) or paste your work below and optionally add instructions.</p>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          setChallenge('');
          setShowModal(true);
          setLoading(true);
          try {
            const form = e.target;
            const formData = new FormData();
            const fileInput = form.querySelector('input[name="file"]');
            const textArea = form.querySelector('textarea[name="text"]');
            const commentInput = form.querySelector('input[name="comment"]');
            if (fileInput && fileInput.files && fileInput.files[0]) formData.append('file', fileInput.files[0]);
            if (textArea && textArea.value) formData.append('text', textArea.value);
            if (commentInput && commentInput.value) formData.append('comment', commentInput.value);

            const res = await api.post('/ai/submitForFeedback', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setChallenge(res.data?.feedback || 'No feedback returned');
          } catch (err) {
            console.error('Submit feedback error', err);
            const msg = err?.response?.data?.error || err?.message || 'Failed to submit for feedback';
            setError(typeof msg === 'string' ? msg : 'Failed to submit for feedback');
          } finally {
            setLoading(false);
          }
        }} style={{ display: 'grid', gap: 10, maxWidth: 720 }}>
          <label>
            File (optional)
            <input type="file" name="file" style={{ display: 'block', marginTop: 6 }} />
          </label>

          <label>
            Or paste your work
            <textarea name="text" rows={8} placeholder="Paste code or text here" style={{ width: '100%', padding: 8, marginTop: 6 }} />
          </label>

          <label>
            Optional instructions
            <input name="comment" placeholder="E.g. focus on performance or style" style={{ width: '100%', padding: 8, marginTop: 6 }} />
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={loading} style={{ padding: '8px 14px' }}>{loading ? 'Submitting...' : 'Submit for AI Feedback'}</button>
            <button type="button" onClick={() => { const f = document.querySelector('form'); if (f) f.reset(); }} style={{ padding: '8px 14px' }}>Clear</button>
          </div>
        </form>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: 20, width: 'min(800px, 92%)', maxHeight: '80vh', overflow: 'auto', borderRadius: 8 }}>
            <h3>Generated Challenge</h3>
            <div style={{ minHeight: 80, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
              {loading ? 'Preparing challenge...' : (error ? <span style={{ color: 'crimson' }}>{error}</span> : challenge)}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { navigator.clipboard?.writeText(challenge); }} disabled={!challenge} style={{ padding: '8px 12px' }}>Copy</button>
              <button onClick={() => { setShowModal(false); setError(''); setChallenge(''); }} style={{ padding: '8px 12px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Intentional thrower component to test Sentry ErrorBoundary for FE errors */}
      {throwNow && (
        <Thrower />
      )}
    </div>
  );
}

function Thrower() {
  // This component throws during render to be captured by Sentry ErrorBoundary
  throw new Error('Test FE render error - Sentry should capture this')
}
