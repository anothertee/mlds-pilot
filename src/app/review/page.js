'use client';

import { useState } from 'react';
import ReviewQueue from '@/components/ReviewQueue';
import { logger } from '@/lib/logger';

const TABS = [
  { label: 'Pending', status: 'auto_tagged', countKey: 'auto_tagged' },
  { label: 'Approved', status: 'approved', countKey: 'approved' },
  { label: 'Restricted', status: 'restricted', countKey: 'restricted' },
  { label: 'Rejected', status: 'rejected', countKey: 'rejected' },
  { label: 'All', status: 'all', countKey: null },
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
      <main style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <a
          href="/"
          style={{ position: 'fixed', top: '1.5rem', left: '1.5rem', fontSize: '0.75rem', color: 'var(--color-machine)', textDecoration: 'none', fontFamily: 'var(--font-dm-mono), monospace' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-body)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-machine)'; }}
        >
          &#8592; Home
        </a>
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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--color-surface)', overflow: 'hidden' }}>

      {/* Sidebar */}
      <aside style={{
        width: '260px',
        minWidth: '260px',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem 1.5rem',
        height: '100vh',
        overflowY: 'auto',
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-body)', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto', lineHeight: '1.2', marginBottom: '0.375rem' }}>
            Review dashboard
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)' }}>
            Community knowledge governance
          </p>
        </div>

        {/* Stats */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { label: 'Submitted', key: 'submitted' },
            { label: 'Pending', key: 'auto_tagged' },
            { label: 'Approved', key: 'approved' },
            { label: 'Restricted', key: 'restricted' },
            { label: 'Rejected', key: 'rejected' },
          ].map(({ label, key }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontFamily: 'var(--font-dm-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </span>
              <span style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--color-body)', fontFamily: 'var(--font-dm-mono), monospace' }}>
                {counts[key] ?? 0}
              </span>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <nav style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {TABS.map((tab) => (
            <button
              key={tab.status}
              onClick={() => setActiveTab(tab.status)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
                textAlign: 'left',
                cursor: 'pointer',
                border: activeTab === tab.status ? '1px solid var(--color-body)' : '1px solid transparent',
                borderRadius: '2px',
                backgroundColor: activeTab === tab.status ? 'var(--color-body)' : 'transparent',
                color: activeTab === tab.status ? 'var(--color-surface)' : 'var(--color-secondary)',
              }}
            >
              <span>{tab.label}</span>
              {tab.countKey && counts[tab.countKey] !== undefined && (
                <span style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  opacity: 0.7,
                }}>
                  {counts[tab.countKey]}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Home link */}
        <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
          <a
            href="/"
            style={{ fontSize: '0.75rem', color: 'var(--color-machine)', textDecoration: 'none', fontFamily: 'var(--font-dm-mono), monospace' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-body)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-machine)'; }}
          >
            &#8592; Home
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem' }}>
        <ReviewQueue
          reviewerPassword={password}
          status={activeTab}
          onDecision={refreshCounts}
          readOnly={activeTab !== 'auto_tagged'}
        />
      </main>

    </div>
  );
}
