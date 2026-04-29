import { getAdminDb } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';
import admin from 'firebase-admin';

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
    const { gcsUri, filename, contributor, note } = await request.json();

    if (!gcsUri || !filename) {
      return Response.json(
        { error: 'gcsUri and filename are required' },
        { status: 400 }
      );
    }

    const docRef = await getAdminDb().collection('submissions').add({
      gcsUri,
      filename,
      contributor: contributor || 'anonymous',
      note: note || '',
      status: 'submitted',
      autoTags: [],
      humanTags: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.success('upload', 'Firestore document created', { id: docRef.id });

    return Response.json(
      { id: docRef.id, gcsUri },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Policy': 'per-hour',
        },
      }
    );
  } catch (error) {
    logger.error('upload', 'Unexpected error', { message: error.message });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
