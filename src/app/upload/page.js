'use client';

import { useEffect, useState } from 'react';
import UploadForm from '@/components/UploadForm';
import InfoOverlay from '@/components/InfoOverlay';
import ReviewerLink from '@/components/ReviewerLink';
import Screensaver from '@/components/Screensaver';


export default function UploadPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // sessionStorage is browser-only — must read inside an effect
    const stored = sessionStorage.getItem('facilitator_auth');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthenticated(stored === 'true');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecking(false);
  }, []);

  async function handleLogin() {
    if (!password) {
      setError('Please enter the facilitator password.');
      return;
    }

    try {
      const response = await fetch('/api/facilitator-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        sessionStorage.setItem('facilitator_auth', 'true');
        setAuthenticated(true);
        setError(null);
      } else {
        setError('Invalid password.');
      }
    } catch (err) {
      setError('Login failed. Try again.');
    }
  }

  if (checking) {
    return null;
  }

  if (!authenticated) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="max-w-sm w-full px-6 space-y-4">
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-body)', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto' }}>
            Facilitator access
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary)' }}>
            Enter the installation password to begin.
          </p>
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Password"
              style={{
                width: '100%',
                border: '1px solid var(--color-border)',
                borderRadius: '2px',
                padding: '0.625rem 0.75rem',
                fontSize: '0.875rem',
                background: 'transparent',
                color: 'var(--color-body)',
                outline: 'none',
                fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-body)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
            />
            {error && <p style={{ fontSize: '0.75rem', color: 'var(--color-rejected)' }}>{error}</p>}
            <button
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '0.625rem 1rem',
                backgroundColor: 'transparent',
                color: 'var(--color-body)',
                fontSize: '0.875rem',
                fontWeight: '500',
                fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: '1.5px solid var(--color-body)',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-body)';
                e.currentTarget.style.color = 'var(--color-surface)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-body)';
              }}
            >
              Enter
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <UploadForm />
      <InfoOverlay dark={false} />
      <ReviewerLink dark={false} />
      <Screensaver />
    </>
  );
}
