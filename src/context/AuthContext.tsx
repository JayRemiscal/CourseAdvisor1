import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  updateProfile as updateFirebaseProfile,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from '../services/firebase';
import { firestoreSync, SyncStatusInfo } from '../services/firestoreSync';

export interface StudentAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  providerId: string;
}

interface AuthContextType {
  currentUser: StudentAuthUser | null;
  loading: boolean;
  authError: string | null;
  syncStatus: SyncStatusInfo;
  isDbConnected: boolean;
  dbConnectionMessage: string;
  signInWithGoogle: () => Promise<boolean>;
  signInAsDemoStudent: (studentType: 'alex' | 'jordan' | 'morgan') => Promise<boolean>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
  checkConnection: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<StudentAuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>({
    state: 'idle',
    lastSyncedAt: null,
    pendingChangesCount: 0,
    errorMessage: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [dbConnectionMessage, setDbConnectionMessage] = useState<string>('Connecting to Cloud Firestore...');

  // Subscribe to sync service state updates
  useEffect(() => {
    const unsubscribeSync = firestoreSync.subscribe(status => {
      setSyncStatus(status);
    });
    return () => unsubscribeSync();
  }, []);

  // Check Firestore connection on startup
  const checkConnection = async () => {
    const res = await testFirestoreConnection();
    setIsDbConnected(res.connected);
    setDbConnectionMessage(res.message);
  };

  useEffect(() => {
    checkConnection();
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email || (user.isAnonymous ? 'student.demo@institution.edu' : null),
          displayName: user.displayName || (user.isAnonymous ? 'Demo Student' : 'Student Scholar'),
          photoURL: user.photoURL,
          isAnonymous: user.isAnonymous,
          providerId: user.providerData[0]?.providerId || (user.isAnonymous ? 'anonymous' : 'firebase'),
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firebase Auth state error:', error);
      setAuthError(error.message);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const signInWithGoogle = async (): Promise<boolean> => {
    setLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setCurrentUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          isAnonymous: false,
          providerId: 'google.com',
        });
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (err: any) {
      console.warn('Google Sign-In failed or popup blocked:', err);
      let msg = err?.message || 'Google sign-in could not be completed.';
      if (err?.code === 'auth/popup-blocked') {
        msg = 'Sign-in popup was blocked by your browser. Please allow popups or use the demo student account option.';
      } else if (err?.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in popup was closed before completing verification.';
      } else if (err?.code === 'auth/network-request-failed') {
        msg = 'Network connection failed. You can continue using offline student credentials.';
      }
      setAuthError(msg);
      setLoading(false);
      return false;
    }
  };

  const signInAsDemoStudent = async (studentType: 'alex' | 'jordan' | 'morgan'): Promise<boolean> => {
    setLoading(true);
    setAuthError(null);

    const demoProfiles = {
      alex: {
        name: 'Alex Rivera',
        email: 'alex.rivera@university.edu',
        degree: 'B.S. Computer Science',
      },
      jordan: {
        name: 'Jordan Taylor',
        email: 'jordan.taylor@university.edu',
        degree: 'B.S. Software Engineering',
      },
      morgan: {
        name: 'Morgan Blake',
        email: 'morgan.blake@university.edu',
        degree: 'B.S. Data Science',
      }
    };

    const target = demoProfiles[studentType];

    try {
      // Use Firebase Anonymous Auth to produce a real cryptographically secure Firebase UID
      const cred = await signInAnonymously(auth);
      if (cred.user) {
        await updateFirebaseProfile(cred.user, {
          displayName: target.name,
        });

        setCurrentUser({
          uid: cred.user.uid,
          email: target.email,
          displayName: target.name,
          photoURL: null,
          isAnonymous: true,
          providerId: 'demo_student',
        });
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (err: any) {
      console.warn('Demo student sign-in fallback:', err);
      // Fallback: If anonymous auth is disabled on the project, create a stable persistent local student identity
      const simulatedUid = `student_${studentType}_${studentType.charCodeAt(0)}876`;
      setCurrentUser({
        uid: simulatedUid,
        email: target.email,
        displayName: target.name,
        photoURL: null,
        isAnonymous: true,
        providerId: 'local_student',
      });
      setLoading(false);
      return true;
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Error signing out from Firebase:', err);
    }
    setCurrentUser(null);
    setLoading(false);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        authError,
        syncStatus,
        isDbConnected,
        dbConnectionMessage,
        signInWithGoogle,
        signInAsDemoStudent,
        signOut,
        clearAuthError,
        checkConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
