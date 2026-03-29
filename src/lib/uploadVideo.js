import { Storage } from '@google-cloud/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { logger } from './logger';

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

export async function uploadVideo(file, contributor, note, onProgress) {
  const timestamp = Date.now();
  const filename = `${timestamp}_${file.name}`;
  const bucketName = 'mlds-project-videos';

  logger.info('uploadVideo', 'Upload started', {
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
      logger.error('uploadVideo', 'GCS upload failed', {
        message: error.message,
      });
      reject(error);
    });

    blobStream.on('finish', () => {
      logger.success('uploadVideo', 'File uploaded to GCS');
      resolve();
    });

    blobStream.end(buffer);
    onProgress(50);
  });

  onProgress(100);

  const gcsUri = `gs://${bucketName}/videos/${filename}`;
  logger.info('uploadVideo', 'GCS URI generated', { gcsUri });

  const docRef = await addDoc(collection(db, 'submissions'), {
    gcsUri,
    filename,
    contributor: contributor || 'anonymous',
    note: note || '',
    status: 'submitted',
    autoTags: [],
    humanTags: [],
    createdAt: serverTimestamp(),
  });

  logger.success('uploadVideo', 'Firestore document created', {
    id: docRef.id,
  });

  return { id: docRef.id, gcsUri };
}