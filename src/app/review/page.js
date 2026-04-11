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
      <main style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '3rem' }}>
        <div className="max-w-sm w-full px-6 space-y-4">
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-body)', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto' }}>
            Reviewer access
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary)' }}>
            Enter your reviewer password to access the dashboard.
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
    <main style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)' }} className="py-12">
      <div className="max-w-3xl mx-auto px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-body)', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto' }}>
              Review dashboard
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary)', marginTop: '0.25rem' }}>
              Community knowledge governance
            </p>
          </div>

          <a
            href="/"
            style={{ fontSize: '0.75rem', color: 'var(--color-machine)', textDecoration: 'none' }}
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
              style={{ border: '1px solid var(--color-border)', borderRadius: '2px', padding: '0.75rem', textAlign: 'center' }}
            >
              <p style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-body)', fontFamily: 'var(--font-dm-mono), monospace' }}>
                {counts[key] ?? 0}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-machine)', marginTop: '0.125rem', fontFamily: 'var(--font-dm-mono), monospace' }}>{label}</p>
            </div>
          ))}
        </div>

        <div style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.status}
                onClick={() => setActiveTab(tab.status)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
                  cursor: 'pointer',
                  border: 'none',
                  borderBottom: activeTab === tab.status ? '2px solid var(--color-body)' : '2px solid transparent',
                  background: activeTab === tab.status ? 'var(--color-body)' : 'transparent',
                  color: activeTab === tab.status ? 'var(--color-surface)' : 'var(--color-secondary)',
                }}
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
