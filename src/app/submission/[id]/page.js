import { adminDb } from '@/lib/firebaseAdmin';
import TagDisplay from '@/components/TagDisplay';
import QRCode from '@/components/QRCode';
import InfoOverlay from '@/components/InfoOverlay';
import ReviewerLink from '@/components/ReviewerLink';

export default async function SubmissionPage({ params }) {
  const { id } = await params;
  const doc = await adminDb.collection('submissions').doc(id).get();

  if (!doc.exists) {
    return (
      <>
        <main style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)' }} className="py-12">
          <div className="max-w-2xl mx-auto px-6">
            <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary)' }}>Submission not found.</p>
          </div>
        </main>
        <InfoOverlay />
      </>
    );
  }

  const submission = doc.data();
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'https://mlds-pilot.vercel.app';
  const submissionURL = `${baseURL}/submission/${id}`;

  return (
    <>
      <main style={{ minHeight: '100vh', backgroundColor: 'var(--color-surface)' }} className="py-12">
        <div className="max-w-2xl mx-auto px-6 space-y-8 page-enter">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-body)', fontFamily: 'var(--font-fraunces), serif', fontOpticalSizing: 'auto' }}>
              Thank you for your submission
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-machine)', marginTop: '0.25rem', fontFamily: 'var(--font-dm-mono), monospace' }}>
              {submission.filename}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-secondary)', marginTop: '0.25rem' }}>
              Contributed by {submission.contributor} · Status:{' '}
              <span style={{
                fontFamily: 'var(--font-dm-mono), monospace',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                border: '1px solid var(--color-machine)',
                borderRadius: '2px',
                padding: '0.125rem 0.375rem',
                color: 'var(--color-machine)',
              }}>
                {submission.status}
              </span>
            </p>
          </div>

          <QRCode url={submissionURL} />

          {submission.note && (
            <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '2px', background: 'transparent' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your note
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-body)' }}>{submission.note}</p>
            </div>
          )}

          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem', fontFamily: 'var(--font-dm-mono), monospace' }}>
              Movement analysis
            </p>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '2px', padding: '1rem' }}>
              <TagDisplay
                autoTags={submission.autoTags || []}
                humanTags={submission.humanTags || []}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p style={{ fontSize: '0.75rem', color: 'var(--color-machine)', fontFamily: 'var(--font-dm-mono), monospace' }}>
              Submission ID: {id}
            </p>

            <a
              href="/upload"
              style={{ fontSize: '0.75rem', color: 'var(--color-body)', textDecoration: 'underline' }}
            >
              Make another submission &#8594;
            </a>
          </div>
        </div>
      </main>
      <InfoOverlay dark={false} />
      <ReviewerLink dark={false} />
    </>
  );
}
