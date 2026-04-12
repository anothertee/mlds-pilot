import admin from 'firebase-admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';

const VALID_STATUSES = ['approved', 'restricted', 'rejected'];

export async function POST(request) {
  try {
    const { submissionId, decision, note, humanTags, reviewerPassword } =
      await request.json();

    if (reviewerPassword !== process.env.REVIEWER_PASSWORD) {
      logger.warn('review', 'Unauthorised review attempt');
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    if (!submissionId || !decision) {
      return Response.json(
        { error: 'submissionId and decision are required' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(decision)) {
      return Response.json(
        { error: `Decision must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    logger.info('review', 'Review decision received', {
      submissionId,
      decision,
      humanTagCount: (humanTags || []).length,
    });

    await getAdminDb().collection('submissions').doc(submissionId).update({
      status: decision,
      reviewerNote: note || '',
      humanTags: humanTags || [],
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.success('review', 'Submission status updated', {
      submissionId,
      decision,
    });

    return Response.json({ success: true, submissionId, decision });
  } catch (error) {
    logger.error('review', 'Unexpected error', { message: error.message });
    return Response.json({ error: error.message }, { status: 500 });
  }
}