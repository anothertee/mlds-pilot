'use client';

import { useState } from 'react';
import ReviewQueue from '@/components/ReviewQueue';
import { logger } from '@/lib/logger';

export default function ReviewPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogin() {
    if (!password) {
      setError('Please enter the reviewer password.');
      return;
    }

    try {
      const response = await fetch(
        `/api/submissions?reviewerPassword=${password}`
      );

      if (response.ok) {
        logger.success('ReviewPage', 'Reviewer authenticated');
        setAuthenticated(true);
        setError(null);
      } else {
        logger.warn('ReviewPage', 'Invalid reviewer password');
        setError('Invalid password.');
      }
    } catch (err) {
      setError('Login failed. Try again.');
    }
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-white py-12">
        <div className="max-w-sm mx-auto px-6 space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Reviewer access
          </h1>
          <p className="text-sm text-gray-500">
            Enter your reviewer password to access the queue.
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
    <main className="min-h-screen bg-white py-12">
      <div className="max-w-2xl mx-auto px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Review queue
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Submissions pending community review.
            </p>
          </div>
          <a
            href="/"
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            &#8592; Back to upload
          </a>
        </div>
        <ReviewQueue reviewerPassword={password} />
      </div>
    </main>
  );
}