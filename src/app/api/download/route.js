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

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000,
      responseDisposition: `attachment; filename="${filename}"`,
    });

    logger.info('download', 'Signed URL generated', { submissionId });

    return Response.redirect(signedUrl);
  } catch (error) {
    logger.error('download', 'Unexpected error', { message: error.message });
    return Response.json({ error: error.message }, { status: 500 });
  }
}