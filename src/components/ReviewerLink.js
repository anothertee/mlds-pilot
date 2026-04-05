export default function ReviewerLink({ dark = false }) {
    return (
      <a
        href="/review"
        className={dark ? 'btn-dark' : 'btn'}
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          fontSize: '0.75rem',
          textDecoration: 'none',
          border: dark ? '1.5px solid #4b5563' : '1.5px solid #111111',
          borderRadius: '0.25rem',
          padding: '0.5rem 1rem',
          backgroundColor: dark ? 'transparent' : '#ffffff',
          color: dark ? '#9ca3af' : '#111111',
          fontWeight: '500',
          zIndex: 50,
        }}
      >
        Reviewer access
      </a>
    );
  }