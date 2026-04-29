import { Storage } from '@google-cloud/storage';
import { getAdminDb } from '@/lib/firebaseAdmin';
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

export async function GET(request) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const allowedOrigins = [
    'https://mlds-pilot.vercel.app',
    'https://mlds-pilot-o0lh0sbu3-anothertees-projects.vercel.app',
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
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return Response.json(
        { error: 'submissionId is required' },
        { status: 400 }
      );
    }

    const doc = await getAdminDb()
      .collection('submissions')
      .doc(submissionId)
      .get();

    if (!doc.exists) {
      return Response.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const { gcsUri, filename } = doc.data();

    const storage = getStorageClient();
    const bucketName = 'mlds-project-videos';
    const filePath = gcsUri.replace(`gs://${bucketName}/`, '');
    const file = storage.bucket(bucketName).file(filePath);

    const inline = searchParams.get('inline') === 'true';
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
      ...(inline ? {} : { responseDisposition: `attachment; filename="${filename}"` }),
    });

    logger.info('download', 'Signed URL generated', { submissionId });

    return Response.redirect(signedUrl);
  } catch (error) {
    logger.error('download', 'Unexpected error', { message: error.message });
    return Response.json({ error: error.message }, { status: 500 });
  }
}