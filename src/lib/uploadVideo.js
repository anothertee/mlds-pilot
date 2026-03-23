import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from './firebase';

export async function uploadVideo(file, contributor, note, onProgress) {
  const timestamp = Date.now();
  const filename = `${timestamp}_${file.name}`;
  const storageRef = ref(storage, `videos/${filename}`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

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

          resolve({ id: docRef.id, videoURL: downloadURL });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}