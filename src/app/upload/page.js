'use client';

import { useEffect, useState } from 'react';
import UploadForm from '@/components/UploadForm';
import InfoOverlay from '@/components/InfoOverlay';
import ReviewerLink from '@/components/ReviewerLink';


export default function UploadPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('facilitator_auth');
    if (stored === 'true') {
      setAuthenticated(true);
    }
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
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-sm w-full px-6 space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Facilitator access
          </h1>
          <p className="text-sm text-gray-500">
            Enter the installation password to begin.
          </p>
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Password"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={handleLogin}
              className="w-full py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
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
      <main className="min-h-screen bg-white py-12">
        <div className="max-w-xl mx-auto px-6">
          <UploadForm />
        </div>
      </main>
      <InfoOverlay dark={false} />
      <ReviewerLink dark={false} />
    </>
  );
}