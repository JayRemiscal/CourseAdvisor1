import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  doc, 
  getDocFromServer
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  browserLocalPersistence, 
  setPersistence 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configure Firestore with IndexedDB multi-tab persistent cache for true offline-first behavior
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId.trim() !== ''
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

let dbInstance;
try {
  if (dbId) {
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, dbId);
  } else {
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  }
} catch {
  // If already initialized, retrieve existing instance
  dbInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

export const db = dbInstance;

// Configure Auth
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.warn('Firebase auth persistence setup warning:', err);
});

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const firebaseAppConfig = firebaseConfig;

/**
 * Validates connection to Cloud Firestore per skill directive
 */
export async function testFirestoreConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { connected: true, message: 'Cloud Firestore is actively connected.' };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline') || error.message.includes('unavailable')) {
        return { connected: false, message: 'Offline mode: Operating via local IndexedDB cache.' };
      }
      // Permission denied on test/connection is normal when security rules block default writes
      if (error.message.includes('permission-denied') || error.message.includes('missing or insufficient permissions')) {
        return { connected: true, message: 'Connected to Cloud Firestore (Secured with Rules).' };
      }
      return { connected: true, message: `Connected with status: ${error.message}` };
    }
    return { connected: false, message: 'Unknown connection state' };
  }
}
