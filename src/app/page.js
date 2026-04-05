'use client';

import InfoOverlay from '@/components/InfoOverlay';
import ReviewerLink from '@/components/ReviewerLink';

export default function WelcomePage() {
  return (
    <>
      <main
        style={{
          backgroundColor: '#0a0a0a',
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
            <p style={{ fontSize: '0.75rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', marginBottom: '1.5rem' }}>
              An installation by Tamlyn LouHing
            </p>
            <h1 style={{ fontSize: '3rem', fontWeight: '600', color: '#ffffff', lineHeight: '1.1', marginBottom: '1.5rem' }}>
              Movement Language<br />Discovery System
            </h1>
            <p style={{ fontSize: '1rem', lineHeight: '1.75', color: '#9ca3af', marginBottom: '0.75rem' }}>
              A community-governed archive of Caribbean and diaspora movement knowledge.
            </p>
          </div>

          <a
            href="/upload"
            style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              backgroundColor: '#ffffff',
              color: '#111111',
              fontSize: '0.875rem',
              fontWeight: '500',
              borderRadius: '0.25rem',
              textDecoration: 'none',
            }}
          >
            Begin
          </a>
        </div>

        <p style={{ position: 'absolute', bottom: '3rem', width: '100%', maxWidth: '36rem', fontSize: '0.75rem', color: '#4b5563', lineHeight: '1.75', textAlign: 'center' }}>
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