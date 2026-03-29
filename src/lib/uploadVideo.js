import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage, ensureAuth } from './firebase';
import { logger } from './logger';

export async function uploadVideo(file, contributor, note, onProgress) {
  await ensureAuth();

  const timestamp = Date.now();
  const filename = `${timestamp}_${file.name}`;
  const storageRef = ref(storage, `videos/${filename}`);

  logger.info('uploadVideo', 'Upload started', {
    filename,
    size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    type: file.type,
  });

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress(progress);
        logger.info('uploadVideo', `Upload progress: ${progress}%`);
      },
      (error) => {
        logger.error('uploadVideo', 'Storage upload failed', {
          code: error.code,
          message: error.message,
        });
        reject(error);
      },
      async () => {
        try {
          logger.success('uploadVideo', 'File uploaded to Storage');

          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          logger.info('uploadVideo', 'Download URL retrieved', { downloadURL });

          const docRef = await addDoc(collection(db, 'submissions'), {
            videoURL: downloadURL,
            filename: filename,
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

          resolve({ id: docRef.id, videoURL: downloadURL });
        } catch (error) {
          logger.error('uploadVideo', 'Firestore write failed', {
            message: error.message,
          });
          reject(error);
        }
      }
    );
  });
}