import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  AcademicPlan, 
  GradeRecord, 
  StudentProfile, 
  TermType, 
  LetterGrade,
  PrerequisiteValidationResult,
  WorkloadSummary,
  AcademicActivity,
  AutoPlanningInputs,
  GeneratedPlanResult,
  CoursePlacementExplanation,
  MoveValidationResult,
  Course
} from '../types/academic';
import { DEFAULT_STUDENT_PROFILE, INITIAL_GRADE_RECORDS, INITIAL_ACTIVITIES, SAMPLE_PLANS } from '../data/samplePlans';
import { COURSES_DATA, COURSE_BY_CODE_MAP, COURSE_BY_ID_MAP } from '../data/coursesData';
import { 
  calculateGpa, 
  calculateMajorGpa, 
  calculateDegreeProgress, 
  validatePrerequisites,
  calculateSemesterWorkload,
  DegreeProgressAudit
} from '../utils/academicCalculations';
import { generateAutomaticPlan, validateCourseMove } from '../utils/academicPlannerEngine';
import { 
  SemesterWorkloadAssessment, 
  evaluateSemesterFuzzyWorkload 
} from '../utils/fuzzyInferenceEngine';
import { useAuth } from './AuthContext';
import { firestoreSync } from '../services/firestoreSync';

interface PrerequisiteAlert {
  courseCode: string;
  courseTitle: string;
  semesterId: string;
  semesterName: string;
  missingPrereqs: string[];
}

export interface ToastNotice {
  id: string;
  text: string;
  type: 'success' | 'info' | 'error';
}

interface AcademicContextType {
  profile: StudentProfile;
  plans: AcademicPlan[];
  activePlanId: string;
  activePlan: AcademicPlan;
  gradeRecords: GradeRecord[];
  degreeAudit: DegreeProgressAudit;
  cumulativeGpa: number;
  majorGpa: number;
  completedCreditsCount: number;
  inProgressCreditsCount: number;
  remainingCreditsCount: number;
  completedCoursesCount: number;
  remainingCoursesCount: number;
  totalRequiredCoursesCount: number;
  prerequisiteAlerts: PrerequisiteAlert[];
  activities: AcademicActivity[];
  toasts: ToastNotice[];
  activePlanExplanations: Record<string, CoursePlacementExplanation>;
  unscheduledCourses: Array<{ course: Course; reason: string }>;
  planAssumptions: string[];
  courseConfidenceRatings: Record<string, number>;
  
  // Actions
  updateProfile: (updated: Partial<StudentProfile>) => void;
  setActivePlanId: (planId: string) => void;
  addCourseToSemester: (semesterId: string, courseId: string, planId?: string) => boolean;
  removeCourseFromSemester: (semesterId: string, courseId: string, planId?: string) => void;
  moveCourseBetweenSemesters: (fromSemesterId: string, toSemesterId: string, courseId: string, planId?: string) => void;
  addSemesterToPlan: (term: TermType, year: number, academicYear: string, planId?: string) => void;
  removeSemesterFromPlan: (semesterId: string, planId?: string) => void;
  clearSemester: (semesterId: string, planId?: string) => void;
  createPlan: (name: string, description: string, duplicateFromId?: string) => string;
  deletePlan: (planId: string) => void;
  renamePlan: (planId: string, newName: string, newDescription?: string) => void;
  duplicatePlan: (planId: string, customName?: string) => string;
  saveActivePlan: () => void;
  generateNewPlan: (inputs: AutoPlanningInputs) => GeneratedPlanResult;
  validateCourseMoveAction: (courseId: string, fromSemesterId: string, toSemesterId: string) => MoveValidationResult;
  setCourseConfidence: (courseCode: string, rating: number) => void;
  resetCourseConfidence: (courseCode: string) => void;
  getCourseConfidence: (courseCode: string) => { value: number; isSample: boolean };
  updateCourseGrade: (courseCode: string, grade: LetterGrade, term: string, credits: number, source?: 'sample' | 'student') => void;
  removeGradeRecord: (courseCode: string) => void;
  setCourseStatus: (
    courseCode: string,
    status: 'completed' | 'in-progress' | 'not-taken',
    options?: { grade?: LetterGrade; credits?: number; term?: string }
  ) => void;
  addActivity: (activity: Omit<AcademicActivity, 'id' | 'timestamp'>) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  resetToDefaults: () => void;
  exportDataJson: () => string;
  importDataJson: (jsonString: string) => boolean;
  
  // Helpers
  checkCoursePrerequisites: (courseCode: string, semesterId: string | null) => PrerequisiteValidationResult;
  getSemesterWorkload: (semesterId: string, planId?: string) => WorkloadSummary;
  getSemesterFuzzyWorkload: (semesterId: string, planId?: string) => SemesterWorkloadAssessment;
}

const STORAGE_KEY = 'courseadvisor_msun_bses_v4';

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export const AcademicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_profile`);
      return stored ? JSON.parse(stored) : DEFAULT_STUDENT_PROFILE;
    } catch {
      return DEFAULT_STUDENT_PROFILE;
    }
  });

  const [plans, setPlans] = useState<AcademicPlan[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_plans`);
      return stored ? JSON.parse(stored) : SAMPLE_PLANS;
    } catch {
      return SAMPLE_PLANS;
    }
  });

  const [activePlanId, setActivePlanId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_active_plan_id`);
      return stored || SAMPLE_PLANS[0].id;
    } catch {
      return SAMPLE_PLANS[0].id;
    }
  });

  const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_grades`);
      return stored ? JSON.parse(stored) : INITIAL_GRADE_RECORDS;
    } catch {
      return INITIAL_GRADE_RECORDS;
    }
  });

  const [activities, setActivities] = useState<AcademicActivity[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_activities`);
      return stored ? JSON.parse(stored) : INITIAL_ACTIVITIES;
    } catch {
      return INITIAL_ACTIVITIES;
    }
  });

  const [toasts, setToasts] = useState<ToastNotice[]>([]);
  const [activePlanExplanations, setActivePlanExplanations] = useState<Record<string, CoursePlacementExplanation>>({});
  const [unscheduledCourses, setUnscheduledCourses] = useState<Array<{ course: Course; reason: string }>>([]);
  const [planAssumptions, setPlanAssumptions] = useState<string[]>([
    'MSU-Naawan BSES Curriculum Prospectus (BOR Res. 357 S. 2018 / APC Res. 34 S. 2018; 168 Units) used as standard degree baseline.',
    "Kahn's topological sort determines prerequisite tiers and valid linear course progression; no course placed prior to prerequisites.",
    'Target credit load is balanced across regular semesters to maintain academic sustainability.',
    'Course placement prioritizes unlocking downstream prerequisite dependencies (critical path).',
    'No proprietary mathematical optimizer is claimed; scheduling uses transparent Kahn topological tiering + bin-packing.',
    'Courses assume standard seasonal university offering (1st Semester, 2nd Semester, Summer Gateway).'
  ]);

  // Pre-seeded realistic confidence ratings (sample baseline)
  const DEFAULT_SAMPLE_CONFIDENCE: Record<string, number> = {
    'GEC101': 8.5,
    'GEC102': 8.0,
    'GEC120': 7.5,
    'MAT051': 6.0,
    'ENS011': 8.0,
    'Physics 11': 5.0,
    'Physics 11.1': 6.5,
    'PED011': 9.0,
    'NST001': 9.0,
    'GEC103': 8.0,
    'GEC104': 7.5,
    'GEC105': 8.0,
    'GEC110': 7.0,
    'GEC130': 8.5,
    'PHY012': 6.0,
    'PED012': 9.0,
    'NST002': 9.0,
    'ENS022': 6.5,
    'ENS024': 6.0,
    'CHM043': 4.5,
    'CHM043.1': 5.0,
    'MAT038': 5.5,
    'ENS035': 5.0,
    'ENS041': 6.0,
    'CHM033': 4.5,
    'ENS198': 6.0,
    'ENS199': 6.5,
  };

  const [courseConfidenceRatings, setCourseConfidenceRatings] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_confidence_ratings`);
      return stored ? JSON.parse(stored) : DEFAULT_SAMPLE_CONFIDENCE;
    } catch {
      return DEFAULT_SAMPLE_CONFIDENCE;
    }
  });

  const { currentUser, syncStatus } = useAuth();

  // Cloud Firestore hydration: When a student logs in or switches accounts, load their isolated records
  useEffect(() => {
    if (!currentUser?.uid) return;

    let isMounted = true;

    const loadCloudData = async () => {
      try {
        const [cloudProfile, cloudProgress, cloudPlans, cloudConf] = await Promise.all([
          firestoreSync.loadUserProfile(currentUser.uid),
          firestoreSync.loadAcademicProgress(currentUser.uid),
          firestoreSync.loadAcademicPlans(currentUser.uid),
          firestoreSync.loadConfidenceRatings(currentUser.uid),
        ]);

        if (!isMounted) return;

        if (cloudProfile) {
          setProfile(prev => ({ ...prev, ...cloudProfile }));
        } else {
          firestoreSync.saveUserProfile(currentUser.uid, profile, currentUser.email || undefined);
        }

        if (cloudProgress && cloudProgress.length > 0) {
          setGradeRecords(cloudProgress);
        } else {
          firestoreSync.saveAcademicProgress(currentUser.uid, gradeRecords);
        }

        if (cloudPlans && cloudPlans.length > 0) {
          setPlans(cloudPlans);
          setActivePlanId(cloudPlans[0].id);
        } else {
          plans.forEach(p => firestoreSync.saveAcademicPlan(currentUser.uid, p));
        }

        if (cloudConf && Object.keys(cloudConf).length > 0) {
          const confMap: Record<string, number> = {};
          Object.entries(cloudConf).forEach(([k, v]) => { confMap[k] = v.value; });
          setCourseConfidenceRatings(confMap);
        }
      } catch (err) {
        console.warn('Could not hydrate student cloud data:', err);
      }
    };

    loadCloudData();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_profile`, JSON.stringify(profile));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_plans`, JSON.stringify(plans));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [plans]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_active_plan_id`, activePlanId);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [activePlanId]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_grades`, JSON.stringify(gradeRecords));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    if (currentUser?.uid) {
      firestoreSync.saveAcademicProgress(currentUser.uid, gradeRecords);
    }
  }, [gradeRecords, currentUser?.uid]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_activities`, JSON.stringify(activities));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [activities]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_confidence_ratings`, JSON.stringify(courseConfidenceRatings));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [courseConfidenceRatings]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addActivity = (act: Omit<AcademicActivity, 'id' | 'timestamp'>) => {
    const newAct: AcademicActivity = {
      ...act,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: 'Just now',
    };
    setActivities(prev => [newAct, ...prev.slice(0, 19)]);
  };

  // Active plan lookup with fallback
  const activePlan = useMemo(() => {
    const found = plans.find(p => p.id === activePlanId);
    return found || plans[0] || SAMPLE_PLANS[0];
  }, [plans, activePlanId]);

  // Computed academic metrics
  const { gpa: cumulativeGpa } = useMemo(() => calculateGpa(gradeRecords), [gradeRecords]);
  const majorGpa = useMemo(() => calculateMajorGpa(gradeRecords), [gradeRecords]);

  const degreeAudit = useMemo(() => {
    return calculateDegreeProgress(activePlan.semesters, gradeRecords);
  }, [activePlan.semesters, gradeRecords]);

  const completedCreditsCount = degreeAudit.totalCompletedCredits;
  const inProgressCreditsCount = degreeAudit.totalInProgressCredits;

  // Real-time prerequisite validation across current and planned semesters
  const prerequisiteAlerts = useMemo(() => {
    const alerts: PrerequisiteAlert[] = [];
    const semesters = activePlan.semesters;

    for (const sem of semesters) {
      if (sem.isCompleted) continue; // completed terms already finalized

      for (const cId of sem.courseIds) {
        const course = COURSE_BY_ID_MAP.get(cId);
        if (!course) continue;

        const val = validatePrerequisites(course.code, sem.id, semesters, gradeRecords);
        if (!val.satisfied) {
          alerts.push({
            courseCode: course.code,
            courseTitle: course.title,
            semesterId: sem.id,
            semesterName: sem.name,
            missingPrereqs: val.missingPrereqs,
          });
        }
      }
    }

    return alerts;
  }, [activePlan.semesters, gradeRecords]);

  // Actions
  const updateProfile = (updated: Partial<StudentProfile>) => {
    setProfile(prev => {
      const merged = { ...prev, ...updated };
      if (currentUser?.uid) {
        firestoreSync.saveUserProfile(currentUser.uid, merged, currentUser.email || undefined);
      }
      return merged;
    });
  };

  const addCourseToSemester = (semesterId: string, courseId: string, planId?: string): boolean => {
    const targetPlanId = planId || activePlanId;
    let added = false;

    setPlans(prevPlans =>
      prevPlans.map(plan => {
        if (plan.id !== targetPlanId) return plan;

        const targetSem = plan.semesters.find(s => s.id === semesterId);
        if (targetSem && targetSem.courseIds.includes(courseId)) {
          return plan; // Already scheduled in this specific term
        }

        added = true;
        // Enforce strict duplicate prevention across all semesters in the plan
        const updatedSemesters = plan.semesters.map(sem => {
          if (sem.id === semesterId) {
            return {
              ...sem,
              courseIds: [...sem.courseIds.filter(id => id !== courseId), courseId],
            };
          } else {
            return {
              ...sem,
              courseIds: sem.courseIds.filter(id => id !== courseId),
            };
          }
        });

        return {
          ...plan,
          semesters: updatedSemesters,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    return added;
  };

  const removeCourseFromSemester = (semesterId: string, courseId: string, planId?: string) => {
    const targetPlanId = planId || activePlanId;
    setPlans(prevPlans =>
      prevPlans.map(plan => {
        if (plan.id !== targetPlanId) return plan;

        return {
          ...plan,
          semesters: plan.semesters.map(sem => {
            if (sem.id !== semesterId) return sem;
            return {
              ...sem,
              courseIds: sem.courseIds.filter(id => id !== courseId),
            };
          }),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const moveCourseBetweenSemesters = (
    fromSemesterId: string,
    toSemesterId: string,
    courseId: string,
    planId?: string
  ) => {
    if (fromSemesterId === toSemesterId) return;
    const targetPlanId = planId || activePlanId;

    setPlans(prevPlans =>
      prevPlans.map(plan => {
        if (plan.id !== targetPlanId) return plan;

        return {
          ...plan,
          semesters: plan.semesters.map(sem => {
            if (sem.id === fromSemesterId) {
              return {
                ...sem,
                courseIds: sem.courseIds.filter(id => id !== courseId),
              };
            }
            if (sem.id === toSemesterId) {
              if (sem.courseIds.includes(courseId)) return sem;
              return {
                ...sem,
                courseIds: [...sem.courseIds, courseId],
              };
            }
            return sem;
          }),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const addSemesterToPlan = (term: TermType, year: number, academicYear: string, planId?: string) => {
    const targetPlanId = planId || activePlanId;
    const newSemId = `sem-${Date.now()}`;
    const newSemName = `Year ${year} · ${term}`;

    setPlans(prevPlans =>
      prevPlans.map(plan => {
        if (plan.id !== targetPlanId) return plan;

        const newSemester = {
          id: newSemId,
          name: newSemName,
          term,
          year,
          academicYear,
          courseIds: [],
        };

        return {
          ...plan,
          semesters: [...plan.semesters, newSemester],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const removeSemesterFromPlan = (semesterId: string, planId?: string) => {
    const targetPlanId = planId || activePlanId;
    setPlans(prevPlans =>
      prevPlans.map(plan => {
        if (plan.id !== targetPlanId) return plan;
        return {
          ...plan,
          semesters: plan.semesters.filter(s => s.id !== semesterId),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const clearSemester = (semesterId: string, planId?: string) => {
    const targetPlanId = planId || activePlanId;
    setPlans(prevPlans =>
      prevPlans.map(plan => {
        if (plan.id !== targetPlanId) return plan;
        return {
          ...plan,
          semesters: plan.semesters.map(s => (s.id === semesterId ? { ...s, courseIds: [] } : s)),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const createPlan = (name: string, description: string, duplicateFromId?: string): string => {
    const newId = `plan-${Date.now()}`;
    let initialSemesters = SAMPLE_PLANS[0].semesters;

    if (duplicateFromId) {
      const src = plans.find(p => p.id === duplicateFromId);
      if (src) {
        initialSemesters = JSON.parse(JSON.stringify(src.semesters));
      }
    }

    const newPlan: AcademicPlan = {
      id: newId,
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      semesters: initialSemesters,
    };

    setPlans(prev => [...prev, newPlan]);
    setActivePlanId(newId);
    return newId;
  };

  const deletePlan = (planId: string) => {
    if (plans.length <= 1) return; // Keep at least one
    if (currentUser?.uid) {
      firestoreSync.deleteAcademicPlan(currentUser.uid, planId);
    }
    setPlans(prev => prev.filter(p => p.id !== planId));
    if (activePlanId === planId) {
      const remaining = plans.filter(p => p.id !== planId);
      if (remaining.length > 0) {
        setActivePlanId(remaining[0].id);
      }
    }
    showToast('Plan removed from cloud and local storage', 'info');
  };

  const renamePlan = (planId: string, newName: string, newDescription?: string) => {
    setPlans(prevPlans =>
      prevPlans.map(plan => {
        if (plan.id !== planId) return plan;
        const updated = {
          ...plan,
          name: newName,
          description: newDescription !== undefined ? newDescription : plan.description,
          updatedAt: new Date().toISOString(),
        };
        if (currentUser?.uid) {
          firestoreSync.saveAcademicPlan(currentUser.uid, updated);
        }
        return updated;
      })
    );
    showToast(`Plan renamed to "${newName}"`, 'success');
  };

  const duplicatePlan = (planId: string, customName?: string): string => {
    const src = plans.find(p => p.id === planId) || activePlan;
    const newId = `plan-${Date.now()}`;
    const newName = customName || `${src.name} (Copy)`;
    const duplicatedPlan: AcademicPlan = {
      id: newId,
      name: newName,
      description: `Copy of ${src.name}. ${src.description}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      semesters: JSON.parse(JSON.stringify(src.semesters)),
    };
    setPlans(prev => [...prev, duplicatedPlan]);
    setActivePlanId(newId);
    if (currentUser?.uid) {
      firestoreSync.saveAcademicPlan(currentUser.uid, duplicatedPlan);
    }
    showToast(`Duplicated plan: "${newName}" [Synced]`, 'success');
    return newId;
  };

  const saveActivePlan = () => {
    const nowIso = new Date().toISOString();
    setPlans(prevPlans => {
      const updated = prevPlans.map(plan => {
        if (plan.id !== activePlanId) return plan;
        return {
          ...plan,
          updatedAt: nowIso,
        };
      });
      const savedPlan = updated.find(p => p.id === activePlanId) || activePlan;
      if (currentUser?.uid) {
        firestoreSync.saveAcademicPlan(currentUser.uid, savedPlan);
      }
      return updated;
    });
    showToast(`Academic plan "${activePlan.name}" saved to Cloud Firestore & IndexedDB!`, 'success');
  };

  const generateNewPlan = (inputs: AutoPlanningInputs): GeneratedPlanResult => {
    const result = generateAutomaticPlan(inputs, gradeRecords, activePlan.semesters);
    setPlans(prev => [...prev, result.plan]);
    setActivePlanId(result.plan.id);
    setActivePlanExplanations(result.explanations);
    setUnscheduledCourses(result.unscheduledCourses);
    setPlanAssumptions(result.assumptions);
    if (currentUser?.uid) {
      firestoreSync.saveAcademicPlan(currentUser.uid, result.plan);
    }
    showToast(`Generated plan "${result.plan.name}" with ${result.totalTerms} terms!`, 'success');
    addActivity({
      type: 'plan_modified',
      title: 'Auto-Generated Plan Created',
      description: `Generated ${result.plan.name} (${result.totalPlannedCredits} units across ${result.totalTerms} terms).`,
      source: 'student',
    });
    return result;
  };

  const validateCourseMoveAction = (courseId: string, fromSemesterId: string, toSemesterId: string): MoveValidationResult => {
    return validateCourseMove(courseId, fromSemesterId, toSemesterId, activePlan, gradeRecords);
  };

  const setCourseConfidence = (courseCode: string, rating: number) => {
    const clamped = Math.max(1.0, Math.min(10.0, rating));
    setCourseConfidenceRatings(prev => ({
      ...prev,
      [courseCode]: clamped,
    }));
    if (currentUser?.uid) {
      firestoreSync.saveCourseConfidence(currentUser.uid, courseCode, clamped);
    }
    showToast(`Updated confidence for ${courseCode} to ${clamped.toFixed(1)}/10`, 'success');
  };

  const resetCourseConfidence = (courseCode: string) => {
    setCourseConfidenceRatings(prev => {
      const updated = { ...prev };
      delete updated[courseCode];
      return updated;
    });
    showToast(`Reset ${courseCode} confidence to sample default`, 'info');
  };

  const getCourseConfidence = (courseCode: string): { value: number; isSample: boolean } => {
    if (courseCode in courseConfidenceRatings) {
      return { value: courseConfidenceRatings[courseCode], isSample: false };
    }
    return { value: DEFAULT_SAMPLE_CONFIDENCE[courseCode] ?? 6.0, isSample: true };
  };

  const getSemesterFuzzyWorkload = (semesterId: string, planId?: string): SemesterWorkloadAssessment => {
    const targetPlan = planId ? plans.find(p => p.id === planId) || activePlan : activePlan;
    const sem = targetPlan.semesters.find(s => s.id === semesterId);
    if (!sem) {
      return evaluateSemesterFuzzyWorkload(semesterId, 'Unknown Semester', []);
    }

    const coursesList = sem.courseIds
      .map(id => COURSE_BY_ID_MAP.get(id))
      .filter((c): c is Course => c !== undefined)
      .map(course => {
        const confData = getCourseConfidence(course.code);
        const difficultyRating = course.difficultyRating || (course.difficulty ? course.difficulty * 2 : 5);
        return {
          code: course.code,
          title: course.title,
          credits: course.credits,
          difficulty: difficultyRating,
          confidence: confData.value,
          isSampleConfidence: confData.isSample,
        };
      });

    return evaluateSemesterFuzzyWorkload(sem.id, sem.name, coursesList);
  };

  const updateCourseGrade = (courseCode: string, grade: LetterGrade, term: string, credits: number, source: 'sample' | 'student' = 'student') => {
    setGradeRecords(prev => {
      const filtered = prev.filter(r => r.courseCode !== courseCode);
      return [...filtered, { courseCode, grade, term, credits, source, updatedAt: new Date().toISOString() }];
    });
    addActivity({
      type: 'grade_recorded',
      title: `Grade Recorded: ${courseCode}`,
      description: `Updated grade for ${courseCode} to ${grade} (${credits} credits).`,
      source,
    });
    showToast(`Grade updated: ${courseCode} (${grade})`, 'success');
  };

  const setCourseStatus = (
    courseCode: string,
    status: 'completed' | 'in-progress' | 'not-taken',
    options?: { grade?: LetterGrade; credits?: number; term?: string }
  ) => {
    const course = COURSE_BY_CODE_MAP.get(courseCode);
    const courseCredits = options?.credits ?? course?.credits ?? 3;
    const courseTitle = course?.title || courseCode;

    if (status === 'completed') {
      const grade = options?.grade || 'A';
      const term = options?.term || 'Academic-Credit';
      setGradeRecords(prev => {
        const filtered = prev.filter(r => r.courseCode !== courseCode);
        return [...filtered, {
          courseCode,
          grade,
          term,
          credits: courseCredits,
          source: 'student',
          updatedAt: new Date().toISOString()
        }];
      });

      // If course was scheduled in future uncompleted semesters in active plan, remove it so it's not double-counted
      if (course) {
        setPlans(prevPlans =>
          prevPlans.map(plan => {
            if (plan.id !== activePlanId) return plan;
            return {
              ...plan,
              semesters: plan.semesters.map(s => {
                if (!s.isCompleted && s.courseIds.includes(course.id)) {
                  return { ...s, courseIds: s.courseIds.filter(id => id !== course.id) };
                }
                return s;
              }),
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }

      addActivity({
        type: 'grade_recorded',
        title: `Marked ${courseCode} as Completed`,
        description: `Grade recorded as ${grade} (${courseCredits} credits) for ${courseTitle}.`,
        source: 'student'
      });

      showToast(`Updated ${courseCode} to Completed (Grade: ${grade}, ${courseCredits} cr)`, 'success');
    } else if (status === 'in-progress') {
      setGradeRecords(prev => prev.filter(r => r.courseCode !== courseCode));

      if (course) {
        setPlans(prevPlans =>
          prevPlans.map(plan => {
            if (plan.id !== activePlanId) return plan;
            const currentSem = plan.semesters.find(s => s.isCurrent) || plan.semesters.find(s => !s.isCompleted) || plan.semesters[0];
            if (!currentSem) return plan;
            if (currentSem.courseIds.includes(course.id)) return plan;

            return {
              ...plan,
              semesters: plan.semesters.map(s => {
                if (s.id === currentSem.id) {
                  return { ...s, courseIds: [...s.courseIds, course.id] };
                }
                return s;
              }),
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }

      addActivity({
        type: 'status_updated',
        title: `Set ${courseCode} to In Progress`,
        description: `${courseCode} (${courseTitle}) moved to active term enrollment.`,
        source: 'student'
      });

      showToast(`Set ${courseCode} to In Progress in Current Semester`, 'info');
    } else {
      // not-taken
      setGradeRecords(prev => prev.filter(r => r.courseCode !== courseCode));

      if (course) {
        setPlans(prevPlans =>
          prevPlans.map(plan => {
            if (plan.id !== activePlanId) return plan;
            return {
              ...plan,
              semesters: plan.semesters.map(s => {
                if (s.courseIds.includes(course.id)) {
                  return { ...s, courseIds: s.courseIds.filter(id => id !== course.id) };
                }
                return s;
              }),
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }

      addActivity({
        type: 'status_updated',
        title: `Reset ${courseCode} to Not Started`,
        description: `Removed grades and term enrollments for ${courseCode}.`,
        source: 'student'
      });

      showToast(`Reset ${courseCode} to Not Started`, 'info');
    }
  };

  const removeGradeRecord = (courseCode: string) => {
    setGradeRecords(prev => prev.filter(r => r.courseCode !== courseCode));
  };

  const resetToDefaults = () => {
    localStorage.removeItem(`${STORAGE_KEY}_profile`);
    localStorage.removeItem(`${STORAGE_KEY}_plans`);
    localStorage.removeItem(`${STORAGE_KEY}_active_plan_id`);
    localStorage.removeItem(`${STORAGE_KEY}_grades`);
    localStorage.removeItem(`${STORAGE_KEY}_activities`);
    setProfile(DEFAULT_STUDENT_PROFILE);
    setPlans(SAMPLE_PLANS);
    setActivePlanId(SAMPLE_PLANS[0].id);
    setGradeRecords(INITIAL_GRADE_RECORDS);
    setActivities(INITIAL_ACTIVITIES);
    showToast('Reset academic data to default template', 'info');
  };

  const exportDataJson = (): string => {
    const data = {
      profile,
      plans,
      activePlanId,
      gradeRecords,
      activities,
      exportTimestamp: new Date().toISOString(),
      version: '1.0',
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.profile && parsed.plans && Array.isArray(parsed.plans)) {
        setProfile(parsed.profile);
        setPlans(parsed.plans);
        if (parsed.activePlanId) setActivePlanId(parsed.activePlanId);
        if (parsed.gradeRecords) setGradeRecords(parsed.gradeRecords);
        if (parsed.activities) setActivities(parsed.activities);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const checkCoursePrerequisites = (
    courseCode: string,
    semesterId: string | null
  ): PrerequisiteValidationResult => {
    return validatePrerequisites(courseCode, semesterId, activePlan.semesters, gradeRecords);
  };

  const getSemesterWorkload = (semesterId: string, planId?: string): WorkloadSummary => {
    const targetPlan = planId ? plans.find(p => p.id === planId) || activePlan : activePlan;
    const sem = targetPlan.semesters.find(s => s.id === semesterId);
    if (!sem) {
      return {
        totalCredits: 0,
        lectureHours: 0,
        labHours: 0,
        studyHours: 0,
        totalWeeklyHours: 0,
        difficultyScore: 0,
        burnoutRisk: 'Low',
        projectCount: 0,
        examRigorCount: 0,
        recommendations: [],
      };
    }
    return calculateSemesterWorkload(sem.courseIds);
  };

  const remainingCreditsCount = degreeAudit.remainingDegreeCredits;
  const completedCoursesCount = degreeAudit.completedCoursesCount;
  const remainingCoursesCount = degreeAudit.remainingCoursesCount;
  const totalRequiredCoursesCount = degreeAudit.totalRequiredCoursesCount;

  return (
    <AcademicContext.Provider
      value={{
        profile,
        plans,
        activePlanId,
        activePlan,
        gradeRecords,
        degreeAudit,
        cumulativeGpa,
        majorGpa,
        completedCreditsCount,
        inProgressCreditsCount,
        remainingCreditsCount,
        completedCoursesCount,
        remainingCoursesCount,
        totalRequiredCoursesCount,
        prerequisiteAlerts,
        activities,
        toasts,
        activePlanExplanations,
        unscheduledCourses,
        planAssumptions,
        courseConfidenceRatings,
        updateProfile,
        setActivePlanId,
        addCourseToSemester,
        removeCourseFromSemester,
        moveCourseBetweenSemesters,
        addSemesterToPlan,
        removeSemesterFromPlan,
        clearSemester,
        createPlan,
        deletePlan,
        renamePlan,
        duplicatePlan,
        saveActivePlan,
        generateNewPlan,
        validateCourseMoveAction,
        setCourseConfidence,
        resetCourseConfidence,
        getCourseConfidence,
        updateCourseGrade,
        removeGradeRecord,
        setCourseStatus,
        addActivity,
        showToast,
        removeToast,
        resetToDefaults,
        exportDataJson,
        importDataJson,
        checkCoursePrerequisites,
        getSemesterWorkload,
        getSemesterFuzzyWorkload,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
};
