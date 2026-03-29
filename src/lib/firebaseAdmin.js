import admin from 'firebase-admin';

function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const credentials = JSON.parse(
    Buffer.from(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
      'base64'
    ).toString('utf8')
  );

  return admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}

const app = getFirebaseAdmin();
export const adminDb = admin.firestore(app);