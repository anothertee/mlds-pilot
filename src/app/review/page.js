'use client';

import { useState } from 'react';
import ReviewQueue from '@/components/ReviewQueue';
import { logger } from '@/lib/logger';

const TABS = [
  { label: 'Pending', status: 'auto_tagged' },
  { label: 'Approved', status: 'approved' },
  { label: 'Restricted', status: 'restricted' },
  { label: 'Rejected', status: 'rejected' },
  { label: 'All', status: 'all' },
];

export default function ReviewPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('auto_tagged');
  const [counts, setCounts] = useState({});

  async function handleLogin() {
    if (!password) {
      setError('Please enter the reviewer password.');
      return;
    }

    try {
      const response = await fetch(
        `/api/submissions?reviewerPassword=${password}&status=all`
      );

      if (response.ok) {
        const data = await response.json();
        computeCounts(data.submissions);
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

  function computeCounts(submissions) {
    const c = {
      submitted: 0,
      auto_tagged: 0,
      approved: 0,
      restricted: 0,
      rejected: 0,
    };
    submissions.forEach((s) => {
      if (c[s.status] !== undefined) c[s.status]++;
    });
    setCounts(c);
  }

  function refreshCounts() {
    fetch(`/api/submissions?reviewerPassword=${password}&status=all`)
      .then((r) => r.json())
      .then((data) => computeCounts(data.submissions))
      .catch(() => {});
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-white py-12">
        <div className="max-w-sm mx-auto px-6 space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Reviewer access
          </h1>
          <p className="text-sm text-gray-500">
            Enter your reviewer password to access the dashboard.
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
              Review dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Community knowledge governance
            </p>
          </div>
          
          <a
            href="/"
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            &#8592; Home
          </a>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Submitted', key: 'submitted' },
            { label: 'Pending', key: 'auto_tagged' },
            { label: 'Approved', key: 'approved' },
            { label: 'Restricted', key: 'restricted' },
            { label: 'Rejected', key: 'rejected' },
          ].map(({ label, key }) => (
            <div
              key={key}
              className="border border-gray-200 rounded p-3 text-center"
            >
              <p className="text-2xl font-semibold text-gray-900">
                {counts[key] ?? 0}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.status}
                onClick={() => setActiveTab(tab.status)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.status
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <ReviewQueue
          reviewerPassword={password}
          status={activeTab}
          onDecision={refreshCounts}
          readOnly={activeTab !== 'auto_tagged'}
        />
      </div>
    </main>
  );
}