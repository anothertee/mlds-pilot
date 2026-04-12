'use client';

export default function ReviewerLink({ dark = false }) {
  const baseStyle = {
    position: 'fixed',
    top: '1.5rem',
    right: '1.5rem',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-dm-sans), Arial, sans-serif',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textDecoration: 'none',
    border: dark ? '1.5px solid var(--color-border-dark)' : '1.5px solid rgba(18,16,14,0.3)',
    borderRadius: '2px',
    padding: '0.5rem 1rem',
    backgroundColor: dark ? 'transparent' : 'rgba(248,248,248,0.4)',
    backdropFilter: dark ? 'none' : 'blur(8px)',
    WebkitBackdropFilter: dark ? 'none' : 'blur(8px)',
    color: dark ? 'var(--color-secondary-dark)' : '#12100E',
    zIndex: 50,
  };

  return (
    <a
      href="/review"
      style={baseStyle}
      onMouseEnter={(e) => {
        if (dark) {
          e.currentTarget.style.borderColor = 'var(--color-ink-white)';
          e.currentTarget.style.color = 'var(--color-ink-white)';
        } else {
          e.currentTarget.style.backgroundColor = '#12100E';
          e.currentTarget.style.borderColor = '#12100E';
          e.currentTarget.style.color = '#F8F8F8';
        }
      }}
      onMouseLeave={(e) => {
        if (dark) {
          e.currentTarget.style.borderColor = 'var(--color-border-dark)';
          e.currentTarget.style.color = 'var(--color-secondary-dark)';
        } else {
          e.currentTarget.style.backgroundColor = 'rgba(248,248,248,0.4)';
          e.currentTarget.style.borderColor = 'rgba(18,16,14,0.3)';
          e.currentTarget.style.color = '#12100E';
        }
      }}
    >
      Reviewer access
    </a>
  );
}
