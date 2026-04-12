'use client';

import InfoOverlay from '@/components/InfoOverlay';
import ReviewerLink from '@/components/ReviewerLink';
import WaterCanvas from '@/components/WaterCanvas';

export default function WelcomePage() {
  return (
    <>
      <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: 'var(--color-surface)' }}>
        <WaterCanvas />
        <main
          style={{
            position: 'relative',
            zIndex: 1,
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
              <h1 style={{ fontSize: '3rem', fontWeight: '600', color: '#12100E', lineHeight: '1.1', marginBottom: '1.5rem', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto' }}>
                Movement Language<br />Discovery System
              </h1>
              <p style={{ fontSize: '1rem', lineHeight: '1.75', color: '#2C3E3A', marginBottom: '0.75rem', fontFamily: 'var(--font-dm-sans), Arial, sans-serif' }}>
                Creating a community-governed archive of Caribbean and diaspora movement knowledge.
              </p>
            </div>

            <a
              href="/upload"
              style={{
                display: 'inline-block',
                padding: '0.75rem 2rem',
                backgroundColor: '#12100E',
                color: '#F0EDE6',
                fontSize: '0.875rem',
                fontWeight: '500',
                fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: '1.5px solid #12100E',
                borderRadius: '2px',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#12100E';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#12100E';
                e.currentTarget.style.color = '#F0EDE6';
              }}
            >
              Begin
            </a>
          </div>

          <p style={{ position: 'absolute', bottom: '3rem', width: '100%', maxWidth: '36rem', fontSize: '0.75rem', color: '#2C3E3A', opacity: 0.7, lineHeight: '1.75', textAlign: 'center', fontFamily: 'var(--font-dm-sans), Arial, sans-serif' }}>
            This installation captures movement data. By participating you consent
            to your recording being reviewed by community members before it enters
            the archive.
          </p>
        </main>
      </div>

      <InfoOverlay dark={false} />
      <ReviewerLink dark={false} />
    </>
  );
}
