import { Storage } from '@google-cloud/storage';
import { logger } from '@/lib/logger';

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

  try {
    const { filename: originalFilename, contentType } = await request.json();

    if (!originalFilename || !contentType) {
      return Response.json(
        { error: 'filename and contentType are required' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const filename = `${timestamp}_${originalFilename}`;
    const bucketName = 'mlds-project-videos';
    const gcsUri = `gs://${bucketName}/videos/${filename}`;

    const storage = getStorageClient();
    const file = storage.bucket(bucketName).file(`videos/${filename}`);

    const [signedUrl] = await file.getSignedUrl({
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
    });

    logger.info('upload/signed-url', 'Signed URL generated', { filename });

    return Response.json({ signedUrl, gcsUri, filename });
  } catch (error) {
    logger.error('upload/signed-url', 'Unexpected error', { message: error.message });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
