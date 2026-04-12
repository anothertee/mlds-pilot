'use client';

import InfoOverlay from '@/components/InfoOverlay';
import ReviewerLink from '@/components/ReviewerLink';

export default function WelcomePage() {
  return (
    <>
      <main
        style={{
          backgroundColor: 'var(--color-ink)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: '36rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: '600', color: 'var(--color-ink-white)', lineHeight: '1.1', marginBottom: '1.5rem', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto' }}>
              Movement Language<br />Discovery System
            </h1>
            <p style={{ fontSize: '1rem', lineHeight: '1.75', color: 'var(--color-machine)', marginBottom: '0.75rem', fontFamily: 'var(--font-dm-sans), Arial, sans-serif' }}>
              Creating a community-governed archive of Caribbean and diaspora movement knowledge.
            </p>
          </div>

          <a
            href="/upload"
            style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              backgroundColor: 'transparent',
              color: 'var(--color-ink-white)',
              fontSize: '0.875rem',
              fontWeight: '500',
              fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: '1.5px solid var(--color-ink-white)',
              borderRadius: '2px',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-ink-white)';
              e.currentTarget.style.color = 'var(--color-ink)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-ink-white)';
            }}
          >
            Begin
          </a>
        </div>

        <p style={{ position: 'absolute', bottom: '3rem', width: '100%', maxWidth: '36rem', fontSize: '0.75rem', color: 'var(--color-border-dark)', lineHeight: '1.75', textAlign: 'center', fontFamily: 'var(--font-dm-sans), Arial, sans-serif' }}>
          This installation captures movement data. By participating you consent
          to your recording being reviewed by community members before it enters
          the archive.
        </p>
      </main>

      <InfoOverlay />
      <ReviewerLink dark={true} />
    </>
  );
}
