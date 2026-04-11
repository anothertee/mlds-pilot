'use client';

export default function TagDisplay({ autoTags = [], humanTags = [] }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div style={{ backgroundColor: '#EFEFEF', padding: '1rem', borderRadius: '2px' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-machine)', fontFamily: 'var(--font-dm-mono), monospace' }}>
            Machine says
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-machine)', marginTop: '0.125rem', fontFamily: 'var(--font-dm-mono), monospace' }}>
            Google Video Intelligence
          </p>
        </div>
        {autoTags.length === 0 ? (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-machine)', fontStyle: 'italic', fontFamily: 'var(--font-dm-mono), monospace' }}>No tags yet</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {autoTags.map((tag, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-machine)',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  border: '1px solid var(--color-machine)',
                  borderRadius: '2px',
                  padding: '0.25rem 0.5rem',
                  background: 'transparent',
                }}>
                  {tag.label}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-machine)', fontFamily: 'var(--font-dm-mono), monospace', marginLeft: '1rem' }}>
                  {(tag.score * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ backgroundColor: 'var(--color-parchment)', padding: '1rem', borderRadius: '2px' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-body)', fontFamily: 'var(--font-dm-sans), Arial, sans-serif' }}>
            Community says
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', marginTop: '0.125rem', fontFamily: 'var(--font-dm-sans), Arial, sans-serif' }}>
            Reviewed and approved
          </p>
        </div>
        {humanTags.length === 0 ? (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', fontStyle: 'italic', fontFamily: 'var(--font-dm-sans), Arial, sans-serif' }}>
            Pending community review
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {humanTags.map((tag, i) => (
              <li key={i}>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-community)',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  border: '1px solid var(--color-community)',
                  borderRadius: '2px',
                  padding: '0.25rem 0.5rem',
                  background: 'transparent',
                  display: 'inline-block',
                  marginBottom: tag.meaning ? '0.25rem' : 0,
                }}>
                  {tag.label}
                </span>
                {tag.meaning && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-body)', marginTop: '0.125rem', fontFamily: 'var(--font-dm-sans), Arial, sans-serif' }}>{tag.meaning}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
