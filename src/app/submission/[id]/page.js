import { adminDb } from '@/lib/firebaseAdmin';
import TagDisplay from '@/components/TagDisplay';
import QRCode from '@/components/QRCode';
import InfoOverlay from '@/components/InfoOverlay';

export default async function SubmissionPage({ params }) {
  const { id } = await params;
  const doc = await adminDb.collection('submissions').doc(id).get();

  if (!doc.exists) {
    return (
      <>
        <main className="min-h-screen bg-white py-12">
          <div className="max-w-2xl mx-auto px-6">
            <p className="text-sm text-gray-500">Submission not found.</p>
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
      <main className="min-h-screen bg-white py-12">
        <div className="max-w-2xl mx-auto px-6 space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Thank you for your submission
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {submission.filename}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Contributed by {submission.contributor} · Status:{' '}
              {submission.status}
            </p>
          </div>

          <QRCode url={submissionURL} />

          {submission.note && (
            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-1">
                Your note
              </p>
              <p className="text-sm text-gray-700">{submission.note}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
              Movement analysis
            </p>
            <div className="border border-gray-200 rounded p-4">
              <TagDisplay
                autoTags={submission.autoTags || []}
                humanTags={submission.humanTags || []}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Submission ID: {id}
            </p>
            
            <a
              href="/upload"
              className="text-xs text-gray-700 underline hover:text-gray-900"
            >
              Make another submission &#8594;
            </a>
          </div>
        </div>
      </main>
      <InfoOverlay dark={false} />
    </>
  );
}