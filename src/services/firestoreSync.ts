import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  writeBatch,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  StudentProfile, 
  GradeRecord, 
  AcademicPlan, 
  Semester,
  Course
} from '../types/academic';
import { COURSES_DATA } from '../data/coursesData';

export type SyncState = 'idle' | 'saving' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncStatusInfo {
  state: SyncState;
  lastSyncedAt: Date | null;
  pendingChangesCount: number;
  errorMessage: string | null;
  isOnline: boolean;
}

class FirestoreSyncService {
  private syncListeners: Array<(status: SyncStatusInfo) => void> = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private currentStatus: SyncStatusInfo = {
    state: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'idle',
    lastSyncedAt: null,
    pendingChangesCount: 0,
    errorMessage: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.updateStatus({ isOnline: true, state: 'syncing' });
        setTimeout(() => this.updateStatus({ state: 'synced', lastSyncedAt: new Date() }), 1500);
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.updateStatus({ isOnline: false, state: 'offline' });
      });
    }
  }

  public subscribe(listener: (status: SyncStatusInfo) => void): () => void {
    this.syncListeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  private updateStatus(partial: Partial<SyncStatusInfo>) {
    this.currentStatus = { ...this.currentStatus, ...partial };
    this.syncListeners.forEach(listener => listener(this.currentStatus));
  }

  // --------------------------------------------------------------------------
  // USER PROFILE & PREFERENCES
  // --------------------------------------------------------------------------

  async saveUserProfile(userId: string, profile: StudentProfile, email?: string): Promise<boolean> {
    if (!userId) return false;
    this.updateStatus({ state: 'saving', errorMessage: null });

    try {
      const userDocRef = doc(db, 'users', userId);
      const payload = {
        uid: userId,
        email: email || profile.email || `${userId}@student.university.edu`,
        displayName: profile.name,
        studentId: profile.studentId,
        university: profile.university,
        major: profile.major,
        minor: profile.minor,
        catalogYear: profile.catalogYear,
        targetGradTerm: profile.targetGradTerm,
        targetGradYear: profile.targetGradYear,
        targetGpa: profile.targetGpa,
        maxWeeklyHoursLimit: profile.maxWeeklyHoursLimit,
        maxCreditsPerTerm: profile.maxCreditsPerTerm,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(userDocRef, payload, { merge: true });
      this.updateStatus({ state: 'synced', lastSyncedAt: new Date(), errorMessage: null });
      return true;
    } catch (err: any) {
      console.warn('Error saving user profile to Cloud Firestore:', err);
      // In offline mode, Firestore's persistent cache handles it locally
      if (!this.isOnline || err?.code === 'unavailable') {
        this.updateStatus({ state: 'offline' });
      } else {
        this.updateStatus({ state: 'error', errorMessage: err?.message || 'Failed to save profile' });
      }
      return false;
    }
  }

  async loadUserProfile(userId: string): Promise<Partial<StudentProfile> | null> {
    if (!userId) return null;
    try {
      const userDocRef = doc(db, 'users', userId);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          name: data.displayName || data.name,
          studentId: data.studentId,
          university: data.university,
          email: data.email,
          major: data.major,
          minor: data.minor,
          catalogYear: data.catalogYear,
          targetGradTerm: data.targetGradTerm,
          targetGradYear: data.targetGradYear,
          targetGpa: data.targetGpa,
          maxWeeklyHoursLimit: data.maxWeeklyHoursLimit,
          maxCreditsPerTerm: data.maxCreditsPerTerm,
        };
      }
      return null;
    } catch (err) {
      console.warn('Error loading user profile from Firestore:', err);
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // ACADEMIC PROGRESS (COMPLETED COURSES & GRADES)
  // --------------------------------------------------------------------------

  async saveAcademicProgress(userId: string, records: GradeRecord[]): Promise<boolean> {
    if (!userId) return false;
    this.updateStatus({ state: 'saving' });

    try {
      const batch = writeBatch(db);
      const progressCol = collection(db, 'users', userId, 'academicProgress');

      // Validate inputs: prevent empty courseCode and clamp credits
      for (const record of records) {
        if (!record.courseCode) continue;
        const recordId = `${record.courseCode.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const recordRef = doc(progressCol, recordId);

        batch.set(recordRef, {
          id: recordId,
          userId,
          courseCode: record.courseCode,
          credits: Math.max(0, record.credits),
          grade: record.grade,
          term: record.term,
          source: record.source || 'student',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      await batch.commit();
      this.updateStatus({ state: 'synced', lastSyncedAt: new Date(), errorMessage: null });
      return true;
    } catch (err: any) {
      console.warn('Error saving academic progress to Firestore:', err);
      if (!this.isOnline) {
        this.updateStatus({ state: 'offline' });
      } else {
        this.updateStatus({ state: 'error', errorMessage: err?.message || 'Failed to sync academic progress' });
      }
      return false;
    }
  }

  async loadAcademicProgress(userId: string): Promise<GradeRecord[] | null> {
    if (!userId) return null;
    try {
      const progressCol = collection(db, 'users', userId, 'academicProgress');
      const snap = await getDocs(progressCol);
      if (snap.empty) return null;

      const records: GradeRecord[] = [];
      snap.forEach(docSnap => {
        const d = docSnap.data();
        records.push({
          courseCode: d.courseCode,
          credits: d.credits,
          grade: d.grade,
          term: d.term || d.termCompleted || 'Year 1 · 1st Semester',
          source: d.source || 'student',
          updatedAt: d.updatedAt,
        });
      });
      return records;
    } catch (err) {
      console.warn('Error loading academic progress from Firestore:', err);
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // ACADEMIC PLANS & PLANNED SEMESTERS
  // --------------------------------------------------------------------------

  async saveAcademicPlan(userId: string, plan: AcademicPlan): Promise<boolean> {
    if (!userId || !plan.id) return false;
    this.updateStatus({ state: 'saving' });

    try {
      const batch = writeBatch(db);
      const planDocRef = doc(db, 'users', userId, 'academicPlans', plan.id);

      // Save parent plan document
      batch.set(planDocRef, {
        id: plan.id,
        userId,
        name: plan.name,
        description: plan.description || '',
        isDefault: plan.isDefault ?? false,
        createdAt: plan.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Save individual semester subcollection docs
      const semestersCol = collection(db, 'users', userId, 'academicPlans', plan.id, 'semesters');
      plan.semesters.forEach((sem, idx) => {
        const semRef = doc(semestersCol, sem.id);
        batch.set(semRef, {
          id: sem.id,
          planId: plan.id,
          userId,
          name: sem.name,
          term: sem.term,
          year: sem.year,
          academicYear: sem.academicYear,
          courseIds: sem.courseIds || [],
          isCompleted: sem.isCompleted ?? false,
          isCurrent: sem.isCurrent ?? false,
          orderIndex: idx,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      });

      await batch.commit();
      this.updateStatus({ state: 'synced', lastSyncedAt: new Date(), errorMessage: null });
      return true;
    } catch (err: any) {
      console.warn('Error saving academic plan to Firestore:', err);
      if (!this.isOnline) {
        this.updateStatus({ state: 'offline' });
      } else {
        this.updateStatus({ state: 'error', errorMessage: err?.message || 'Failed to save academic plan' });
      }
      return false;
    }
  }

  async loadAcademicPlans(userId: string): Promise<AcademicPlan[] | null> {
    if (!userId) return null;
    try {
      const plansCol = collection(db, 'users', userId, 'academicPlans');
      const snap = await getDocs(plansCol);
      if (snap.empty) return null;

      const loadedPlans: AcademicPlan[] = [];

      for (const planDoc of snap.docs) {
        const pData = planDoc.data();
        const semestersCol = collection(db, 'users', userId, 'academicPlans', planDoc.id, 'semesters');
        const sSnap = await getDocs(semestersCol);

        const semesters: Semester[] = [];
        sSnap.forEach(sDoc => {
          const sData = sDoc.data();
          semesters.push({
            id: sData.id,
            name: sData.name,
            term: sData.term,
            year: sData.year || sData.yearNumber || 1,
            academicYear: sData.academicYear,
            courseIds: sData.courseIds || [],
            isCompleted: sData.isCompleted,
            isCurrent: sData.isCurrent,
          });
        });

        // Sort semesters according to year and term order
        semesters.sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          const termScore = (t: string) => t.includes('Fall') || t.includes('1st') ? 1 : t.includes('Spring') || t.includes('2nd') ? 2 : 3;
          return termScore(a.term) - termScore(b.term);
        });

        loadedPlans.push({
          id: pData.id,
          name: pData.name,
          description: pData.description,
          isDefault: pData.isDefault,
          createdAt: pData.createdAt,
          updatedAt: pData.updatedAt,
          semesters,
        });
      }

      return loadedPlans.length > 0 ? loadedPlans : null;
    } catch (err) {
      console.warn('Error loading academic plans from Firestore:', err);
      return null;
    }
  }

  async deleteAcademicPlan(userId: string, planId: string): Promise<boolean> {
    if (!userId || !planId) return false;
    try {
      const planDocRef = doc(db, 'users', userId, 'academicPlans', planId);
      await deleteDoc(planDocRef);
      return true;
    } catch (err) {
      console.warn('Error deleting plan from Firestore:', err);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // STUDENT CONFIDENCE RATINGS (MAMDANI FIS)
  // --------------------------------------------------------------------------

  async saveCourseConfidence(userId: string, courseCode: string, confidence: number, isSample: boolean = false): Promise<boolean> {
    if (!userId || !courseCode) return false;
    try {
      const safeCode = courseCode.replace(/[^a-zA-Z0-9]/g, '_');
      const docRef = doc(db, 'users', userId, 'confidenceRatings', safeCode);
      await setDoc(docRef, {
        courseCode,
        userId,
        confidence: Math.max(1, Math.min(10, confidence)),
        isSample,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return true;
    } catch (err) {
      console.warn('Error saving course confidence:', err);
      return false;
    }
  }

  async loadConfidenceRatings(userId: string): Promise<Record<string, { value: number; isSample: boolean }> | null> {
    if (!userId) return null;
    try {
      const colRef = collection(db, 'users', userId, 'confidenceRatings');
      const snap = await getDocs(colRef);
      if (snap.empty) return null;

      const map: Record<string, { value: number; isSample: boolean }> = {};
      snap.forEach(d => {
        const data = d.data();
        if (data.courseCode) {
          map[data.courseCode] = {
            value: data.confidence,
            isSample: data.isSample ?? false,
          };
        }
      });
      return map;
    } catch (err) {
      console.warn('Error loading confidence ratings from Firestore:', err);
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // INITIALIZE SHARED CATALOG (SEEDING FOR ADVISORS/ADMINS)
  // --------------------------------------------------------------------------

  async checkAndSeedSharedCourses(): Promise<void> {
    try {
      const coursesCol = collection(db, 'courses');
      const snap = await getDocs(coursesCol);
      // If empty and online, populate initial demonstration catalog
      if (snap.empty) {
        const batch = writeBatch(db);
        COURSES_DATA.forEach(c => {
          const docRef = doc(coursesCol, c.id);
          batch.set(docRef, {
            ...c,
            isDemoCourse: true,
            updatedAt: new Date().toISOString()
          });
        });
        await batch.commit();
      }
    } catch {
      // Ignored if permissions restrict writing to courses collection
    }
  }
}

export const firestoreSync = new FirestoreSyncService();
