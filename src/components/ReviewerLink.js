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
    border: dark ? '1.5px solid var(--color-border-dark)' : '1.5px solid var(--color-border)',
    borderRadius: '2px',
    padding: '0.5rem 1rem',
    backgroundColor: dark ? 'transparent' : 'var(--color-surface)',
    color: dark ? 'var(--color-secondary-dark)' : 'var(--color-secondary)',
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
          e.currentTarget.style.borderColor = 'var(--color-body)';
          e.currentTarget.style.color = 'var(--color-body)';
        }
      }}
      onMouseLeave={(e) => {
        if (dark) {
          e.currentTarget.style.borderColor = 'var(--color-border-dark)';
          e.currentTarget.style.color = 'var(--color-secondary-dark)';
        } else {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.color = 'var(--color-secondary)';
        }
      }}
    >
      Reviewer access
    </a>
  );
}
