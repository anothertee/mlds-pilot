import { getAdminDb } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';

const VALID_STATUSES = [
  'submitted',
  'auto_tagged',
  'approved',
  'restricted',
  'rejected',
];

export async function GET(request) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const allowedOrigin = 'https://mlds-pilot.vercel.app';
  const allowedLocalOrigin = 'http://localhost:3000';

  const isAllowedOrigin =
    origin === allowedOrigin ||
    origin === allowedLocalOrigin ||
    referer?.startsWith(allowedOrigin) ||
    referer?.startsWith(allowedLocalOrigin);

  if (!isAllowedOrigin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appCheckToken = request.headers.get('x-firebase-appcheck');

  if (appCheckToken) {
    try {
      const { getAppCheck } = await import('firebase-admin/app-check');
      const appCheck = getAppCheck();
      await appCheck.verifyToken(appCheckToken);
    } catch (err) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const { searchParams } = new URL(request.url);
    const reviewerPassword = request.headers.get('x-reviewer-password') || searchParams.get('reviewerPassword');
    const status = searchParams.get('status');

    if (reviewerPassword !== process.env.REVIEWER_PASSWORD) {
      logger.warn('submissions', 'Unauthorised access attempt');
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const adminDb = getAdminDb();
    let query = adminDb.collection('submissions').orderBy('createdAt', 'desc');

    if (status && status !== 'all') {
      if (!VALID_STATUSES.includes(status)) {
        return Response.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')} or all` },
          { status: 400 }
        );
      }
      query = adminDb
        .collection('submissions')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc');
    }

    const snapshot = await query.get();

    const submissions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate().toISOString() || null,
      reviewedAt: doc.data().reviewedAt?.toDate().toISOString() || null,
    }));

    logger.info('submissions', 'Query complete', {
      status: status || 'all',
      count: submissions.length,
    });

    return Response.json({ submissions });
  } catch (error) {
    logger.error('submissions', 'Unexpected error', { message: error.message });
    return Response.json({ error: error.message }, { status: 500 });
  }
}