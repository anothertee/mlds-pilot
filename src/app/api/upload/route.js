import { Storage } from '@google-cloud/storage';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';
import admin from 'firebase-admin';

function getStorageClient() {
  const credentials = JSON.parse(
    Buffer.from(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
      'base64'
    ).toString('utf8')
  );

  return new Storage({
    projectId: credentials.project_id,
    credentials,
  });
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
    const formData = await request.formData();
    const file = formData.get('file');
    const contributor = formData.get('contributor') || 'anonymous';
    const note = formData.get('note') || '';

    if (!file) {
      return Response.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const bucketName = 'mlds-project-videos';

    logger.info('upload', 'Upload started', {
      filename,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type,
    });

    const storage = getStorageClient();
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(`videos/${filename}`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await new Promise((resolve, reject) => {
      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.type,
      });

      blobStream.on('error', (error) => {
        logger.error('upload', 'GCS upload failed', {
          message: error.message,
        });
        reject(error);
      });

      blobStream.on('finish', () => {
        logger.success('upload', 'File uploaded to GCS');
        resolve();
      });

      blobStream.end(buffer);
    });

    const gcsUri = `gs://${bucketName}/videos/${filename}`;
    logger.info('upload', 'GCS URI generated', { gcsUri });

    const docRef = await getAdminDb().collection('submissions').add({
        gcsUri,
        filename,
        contributor,
        note,
        status: 'submitted',
        autoTags: [],
        humanTags: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    logger.success('upload', 'Firestore document created', {
      id: docRef.id,
    });

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