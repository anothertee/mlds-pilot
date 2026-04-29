import { GoogleAuth } from 'google-auth-library';
import admin from 'firebase-admin';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';

const OPERATION_URL = 'https://videointelligence.googleapis.com/v1/operations';

async function getAuthToken() {
  const credentials = JSON.parse(
    Buffer.from(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
      'base64'
    ).toString('utf8')
  );

  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

export async function POST(request) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const allowedOrigins = [
    'https://mlds-pilot.vercel.app',
    'https://www.movementlanguage.site',
    'https://movementlanguage.site',
    'http://localhost:3000',
  ];

  const isAllowedOrigin =
    allowedOrigins.some((o) => origin === o || referer?.startsWith(o));

  if (!isAllowedOrigin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { operationName, submissionId } = await request.json();

    if (!operationName || !submissionId) {
      return Response.json(
        { error: 'operationName and submissionId are required' },
        { status: 400 }
      );
    }

    logger.info('analyze/status', 'Checking operation status', {
      operationName,
      submissionId,
    });

    const token = await getAuthToken();

    const response = await fetch(
      `${OPERATION_URL}/${operationName}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      logger.error('analyze/status', 'Operation status check failed', error);
      return Response.json(
        { error: error.error?.message || 'Status check failed' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.done) {
      logger.info('analyze/status', 'Operation still processing');
      return Response.json({ done: false });
    }

    logger.success('analyze/status', 'Operation complete, extracting labels');

    const annotations = data.response?.annotationResults?.[0];
    const shotLabels = annotations?.shotLabelAnnotations || [];
    const segmentLabels = annotations?.segmentLabelAnnotations || [];

    const allLabels = [...shotLabels, ...segmentLabels];

    const seen = new Set();
    const autoTags = allLabels
      .map((label) => ({
        label: label.entity.description,
        score: Math.max(
          ...label.segments.map((s) => s.confidence)
        ),
        source: 'google_video_intelligence',
      }))
      .filter((tag) => {
        if (seen.has(tag.label)) return false;
        seen.add(tag.label);
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    logger.info('analyze/status', 'Labels extracted', {
      count: autoTags.length,
      labels: autoTags.map((t) => t.label),
    });

    await getAdminDb().collection('submissions').doc(submissionId).update({
      autoTags,
      status: 'auto_tagged',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.success('analyze/status', 'Firestore updated with auto tags', {
      submissionId,
    });

    return Response.json({ done: true, autoTags });
  } catch (error) {
    logger.error('analyze/status', 'Unexpected error', {
      message: error.message,
    });
    return Response.json({ error: error.message }, { status: 500 });
  }
}