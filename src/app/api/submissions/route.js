import { adminDb } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewerPassword = searchParams.get('reviewerPassword');

    if (reviewerPassword !== process.env.REVIEWER_PASSWORD) {
      logger.warn('submissions', 'Unauthorised access attempt');
      return Response.json(
        { error: 'Unauthorised' },
        { status: 401 }
      );
    }

    const snapshot = await adminDb
      .collection('submissions')
      .where('status', '==', 'auto_tagged')
      .orderBy('createdAt', 'desc')
      .get();

    const submissions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate().toISOString() || null,
    }));

    logger.info('submissions', 'Queue fetched', { count: submissions.length });

    return Response.json({ submissions });
  } catch (error) {
    logger.error('submissions', 'Unexpected error', { message: error.message });
    return Response.json({ error: error.message }, { status: 500 });
  }
}