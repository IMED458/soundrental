import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;
if (firebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(config);
} else {
  console.warn(
    '[soundrental] Firebase is not configured. Copy .env.example to .env and fill in the project keys.'
  );
}

export const db = (app ? getFirestore(app) : null) as Firestore;
export const auth = (app ? getAuth(app) : null) as Auth;
export const storage = (app ? getStorage(app) : null) as FirebaseStorage;
export default app;
