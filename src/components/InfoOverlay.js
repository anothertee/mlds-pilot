'use client';

import { useState } from 'react';

export default function InfoOverlay({ dark = true }) {
  const [open, setOpen] = useState(false);

  const triggerStyle = dark
    ? {
        border: '1.5px solid var(--color-border-dark)',
        color: 'var(--color-secondary-dark)',
        backgroundColor: 'transparent',
      }
    : {
        border: '1.5px solid var(--color-border)',
        color: 'var(--color-secondary)',
        backgroundColor: 'var(--color-surface)',
      };

  const triggerHoverStyle = dark
    ? {
        border: '1.5px solid var(--color-ink-white)',
        color: 'var(--color-ink-white)',
        backgroundColor: 'transparent',
      }
    : {
        border: '1.5px solid var(--color-body)',
        color: 'var(--color-body)',
        backgroundColor: 'var(--color-surface)',
      };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '2px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500',
          fontFamily: 'var(--font-dm-mono), monospace',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          ...triggerStyle,
        }}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, triggerHoverStyle);
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, triggerStyle);
        }}
        aria-label="About this installation"
      >
        i
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--color-ink)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            padding: '3rem 1.5rem',
            overflowY: 'auto',
          }}
        >
          <div style={{ maxWidth: '36rem', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-secondary-dark)', fontFamily: 'var(--font-dm-mono), monospace' }}>
                About this installation
              </p>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-secondary-dark)',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  lineHeight: 1,
                  fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
                }}
                aria-label="Close"
              >
                &#x2715;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-ink-white)', marginBottom: '0.75rem', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto' }}>
                  What is this?
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-machine)', lineHeight: '1.75', fontFamily: 'var(--font-dm-sans), Arial, sans-serif' }}>
                  The Movement Language Discovery System is a community-governed
                  archive of Caribbean and diaspora movement knowledge. It is a
                  pilot installation developed as part of a thesis in Interaction
                  Design at George Brown College.
                </p>
              </div>

              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-ink-white)', marginBottom: '0.75rem', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto' }}>
                  What happens when I participate?
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-machine)', lineHeight: '1.75', fontFamily: 'var(--font-dm-sans), Arial, sans-serif' }}>
                  You record or upload a short video of your movement. The system
                  generates automatic tags using Google Video Intelligence — a machine
                  learning model that identifies what it sees. A community reviewer
                  then adds cultural context and decides whether your submission
                  enters the archive.
                </p>
              </div>

              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-ink-white)', marginBottom: '0.75rem', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto' }}>
                  What does the machine say?
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-machine)', lineHeight: '1.75', fontFamily: 'var(--font-dm-sans), Arial, sans-serif' }}>
                  The automatic tags are intentionally decontextualised. A Caribbean
                  harvest dance might be labelled &ldquo;physical exercise&rdquo; or &ldquo;standing&rdquo;.
                  This gap between what the machine sees and what the movement means
                  is the argument this system is built to make visible.
                </p>
              </div>

              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-ink-white)', marginBottom: '0.75rem', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto' }}>
                  What happens to my data?
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-machine)', lineHeight: '1.75', fontFamily: 'var(--font-dm-sans), Arial, sans-serif' }}>
                  Your video and annotations are stored securely. Nothing enters the
                  public archive without community review and approval. You can request
                  deletion of your submission at any time by contacting the facilitator.
                </p>
              </div>

              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-ink-white)', marginBottom: '0.75rem', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto' }}>
                  What is The Repository?
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-machine)', lineHeight: '1.75', fontFamily: 'var(--font-dm-sans), Arial, sans-serif' }}>
                  Approved submissions from this installation feed into The Repository —
                  a portable, offline knowledge system that can answer questions about
                  cultural movement knowledge. It runs on a Raspberry Pi and never
                  requires an internet connection.
                </p>
              </div>

              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-ink-white)', marginBottom: '0.75rem', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto' }}>
                  Who made this?
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-machine)', lineHeight: '1.75', fontFamily: 'var(--font-dm-sans), Arial, sans-serif' }}>
                  This installation was designed and built by Tamlyn LouHing as part
                  of a thesis in Interaction Design at George Brown College, Spring 2026.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
