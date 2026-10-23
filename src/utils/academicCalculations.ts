import { 
  Course, 
  GradeRecord, 
  LetterGrade, 
  Semester, 
  WorkloadSummary, 
  PrerequisiteValidationResult, 
  PrerequisiteDetail,
  TermType
} from '../types/academic';
import { COURSES_DATA, COURSE_BY_CODE_MAP, COURSE_BY_ID_MAP } from '../data/coursesData';
import { BS_CS_REQUIREMENTS, TARGET_GRADUATION_CREDITS } from '../data/degreeRequirements';

export const GRADE_POINTS: Record<LetterGrade, number> = {
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D': 1.0,
  'F': 0.0,
  'IP': 0.0,
  'P': 4.0,
  '1.0': 4.0,
  '1.25': 3.75,
  '1.5': 3.5,
  '1.75': 3.25,
  '2.0': 3.0,
  '2.25': 2.75,
  '2.5': 2.5,
  '2.75': 2.25,
  '3.0': 2.0,
  '5.0': 0.0,
  'INC': 0.0,
};

export function calculateGpa(records: GradeRecord[]): { gpa: number; totalCredits: number; qualityPoints: number } {
  let qualityPoints = 0;
  let gradedCredits = 0;

  for (const rec of records) {
    if (rec.grade === 'IP') continue;
    const pts = GRADE_POINTS[rec.grade] ?? 0;
    qualityPoints += pts * rec.credits;
    gradedCredits += rec.credits;
  }

  const gpa = gradedCredits > 0 ? Number((qualityPoints / gradedCredits).toFixed(2)) : 0.0;
  return { gpa, totalCredits: gradedCredits, qualityPoints };
}

export function calculateMajorGpa(records: GradeRecord[]): number {
  const majorRecords = records.filter(rec => {
    const course = COURSE_BY_CODE_MAP.get(rec.courseCode);
    return course && (course.requirementCategory === 'MajorCore' || course.requirementCategory === 'MajorElective' || course.requirementCategory === 'PracticumThesis');
  });
  return calculateGpa(majorRecords).gpa;
}

export function calculateSimulatedGpa(
  currentRecords: GradeRecord[],
  futurePlannedCredits: number,
  expectedAvgGrade: LetterGrade
): number {
  const current = calculateGpa(currentRecords);
  const futurePoints = (GRADE_POINTS[expectedAvgGrade] ?? 3.5) * futurePlannedCredits;
  const totalCreds = current.totalCredits + futurePlannedCredits;
  if (totalCreds === 0) return 0;
  return Number(((current.qualityPoints + futurePoints) / totalCreds).toFixed(2));
}

/**
 * Validates prerequisites for a target course within the context of a semester plan and completed grades.
 */
export function validatePrerequisites(
  courseCode: string,
  targetSemesterId: string | null,
  allSemesters: Semester[],
  gradeRecords: GradeRecord[]
): PrerequisiteValidationResult {
  const course = COURSE_BY_CODE_MAP.get(courseCode);
  if (!course) {
    return {
      courseCode,
      satisfied: true,
      missingPrereqs: [],
      details: [],
    };
  }

  if (!course.prerequisites || course.prerequisites.length === 0) {
    return {
      courseCode,
      satisfied: true,
      missingPrereqs: [],
      details: [],
    };
  }

  const completedCodes = new Set(
    gradeRecords
      .filter(r => r.grade !== 'F' && r.grade !== 'IP')
      .map(r => r.courseCode)
  );

  let targetSemIndex = -1;
  if (targetSemesterId) {
    targetSemIndex = allSemesters.findIndex(s => s.id === targetSemesterId);
  }

  const priorSemesterCourseCodes = new Set<string>();
  const sameSemesterCourseCodes = new Set<string>();

  if (targetSemIndex >= 0) {
    for (let i = 0; i < targetSemIndex; i++) {
      for (const cId of allSemesters[i].courseIds) {
        const c = COURSE_BY_ID_MAP.get(cId);
        if (c) priorSemesterCourseCodes.add(c.code);
      }
    }
    for (const cId of allSemesters[targetSemIndex].courseIds) {
      const c = COURSE_BY_ID_MAP.get(cId);
      if (c) sameSemesterCourseCodes.add(c.code);
    }
  }

  const missingPrereqs: string[] = [];
  const details: PrerequisiteDetail[] = [];

  for (const prereqCode of course.prerequisites) {
    const prereqCourse = COURSE_BY_CODE_MAP.get(prereqCode);
    const prereqTitle = prereqCourse ? prereqCourse.title : prereqCode;

    if (completedCodes.has(prereqCode)) {
      details.push({
        prereqCode,
        prereqTitle,
        satisfied: true,
        status: 'completed',
        message: 'Completed with passing grade',
      });
    } else if (targetSemIndex >= 0 && priorSemesterCourseCodes.has(prereqCode)) {
      details.push({
        prereqCode,
        prereqTitle,
        satisfied: true,
        status: 'prior-semester',
        message: 'Scheduled in an earlier semester',
      });
    } else if (targetSemIndex >= 0 && sameSemesterCourseCodes.has(prereqCode)) {
      if (course.corequisites && course.corequisites.includes(prereqCode)) {
        details.push({
          prereqCode,
          prereqTitle,
          satisfied: true,
          status: 'concurrent',
          message: 'Enrolled concurrently as approved corequisite',
        });
      } else {
        missingPrereqs.push(prereqCode);
        details.push({
          prereqCode,
          prereqTitle,
          satisfied: false,
          status: 'concurrent',
          message: 'Cannot take concurrently with prerequisite',
        });
      }
    } else {
      missingPrereqs.push(prereqCode);
      details.push({
        prereqCode,
        prereqTitle,
        satisfied: false,
        status: 'missing',
        message: 'Prerequisite not yet completed or scheduled prior',
      });
    }
  }

  // Validate corequisites (must be enrolled concurrently, in prior term, or passed)
  if (course.corequisites && course.corequisites.length > 0) {
    for (const coreqCode of course.corequisites) {
      // Don't re-check if already processed in prerequisites
      if (course.prerequisites && course.prerequisites.includes(coreqCode)) continue;

      const coreqCourse = COURSE_BY_CODE_MAP.get(coreqCode);
      const coreqTitle = coreqCourse ? coreqCourse.title : coreqCode;

      if (completedCodes.has(coreqCode)) {
        details.push({
          prereqCode: coreqCode,
          prereqTitle: coreqTitle,
          satisfied: true,
          status: 'completed',
          message: 'Corequisite completed with passing grade',
        });
      } else if (targetSemIndex >= 0 && (priorSemesterCourseCodes.has(coreqCode) || sameSemesterCourseCodes.has(coreqCode))) {
        details.push({
          prereqCode: coreqCode,
          prereqTitle: coreqTitle,
          satisfied: true,
          status: 'concurrent',
          message: 'Corequisite scheduled concurrently or in prior semester',
        });
      } else {
        missingPrereqs.push(coreqCode);
        details.push({
          prereqCode: coreqCode,
          prereqTitle: coreqTitle,
          satisfied: false,
          status: 'missing',
          message: 'Corequisite not enrolled concurrently or completed prior',
        });
      }
    }
  }

  return {
    courseCode,
    satisfied: missingPrereqs.length === 0,
    missingPrereqs,
    details,
  };
}

/**
 * Calculates academic workload for a list of course IDs
 */
export function calculateSemesterWorkload(courseIds: string[]): WorkloadSummary {
  const courses: Course[] = [];
  for (const cid of courseIds) {
    const c = COURSE_BY_ID_MAP.get(cid);
    if (c) courses.push(c);
  }

  let totalCredits = 0;
  let lectureHours = 0;
  let labHours = 0;
  let studyHours = 0;
  let weightedDifficulty = 0;
  let projectCount = 0;
  let examRigorCount = 0;

  for (const course of courses) {
    totalCredits += course.credits;
    lectureHours += course.weeklyHours.lecture;
    labHours += course.weeklyHours.lab;
    studyHours += course.weeklyHours.study;
    weightedDifficulty += course.difficulty * course.credits;

    if (course.projectIntensity === 'High') projectCount++;
    if (course.examRigor === 'High') examRigorCount++;
  }

  const difficultyScore = totalCredits > 0 ? Number((weightedDifficulty / totalCredits).toFixed(1)) : 0;
  const totalWeeklyHours = lectureHours + labHours + studyHours;

  let burnoutRisk: WorkloadSummary['burnoutRisk'] = 'Low';
  if (totalWeeklyHours > 54 || totalCredits > 19) {
    burnoutRisk = 'Extreme';
  } else if (totalWeeklyHours >= 46 || (totalCredits >= 17 && projectCount >= 3)) {
    burnoutRisk = 'Heavy';
  } else if (totalWeeklyHours >= 36) {
    burnoutRisk = 'Moderate';
  } else {
    burnoutRisk = 'Low';
  }

  const recommendations: string[] = [];
  if (totalCredits > 18) {
    recommendations.push('Credit overload: Exceeds standard 18-credit term limit without dean approval.');
  }
  if (totalCredits < 12 && totalCredits > 0) {
    recommendations.push('Part-time alert: Under 12 credits may impact full-time student aid and housing eligibility.');
  }
  if (projectCount >= 3) {
    recommendations.push(`Heavy project collision: ${projectCount} simultaneous high-intensity project courses.`);
  }
  if (examRigorCount >= 3) {
    recommendations.push('Intense testing load: 3+ courses with rigorous theoretical midterm and final exams.');
  }
  if (burnoutRisk === 'Extreme' || burnoutRisk === 'Heavy') {
    recommendations.push('Balance suggestion: Consider trading one upper-division course for an elective or Gen-Ed.');
  }

  return {
    totalCredits,
    lectureHours,
    labHours,
    studyHours,
    totalWeeklyHours,
    difficultyScore,
    burnoutRisk,
    projectCount,
    examRigorCount,
    recommendations,
  };
}

export interface CourseAuditItem {
  code: string;
  title: string;
  credits: number;
  level: 100 | 200 | 300 | 400;
  yearLevel: 1 | 2 | 3 | 4;
  department: string;
  termsOffered: TermType[];
  prerequisites: string[];
  status: 'completed' | 'in-progress' | 'planned' | 'not-taken';
  grade?: LetterGrade;
  source?: 'sample' | 'student';
  updatedAt?: string;
}

export interface YearLevelAudit {
  level: 1 | 2 | 3 | 4;
  name: string;
  title: string;
  totalCredits: number;
  completedCredits: number;
  inProgressCredits: number;
  plannedCredits: number;
  percent: number;
  courses: CourseAuditItem[];
}

export interface DegreeProgressAudit {
  totalCompletedCredits: number;
  totalPlannedCredits: number;
  totalInProgressCredits: number;
  remainingDegreeCredits: number;
  completedCoursesCount: number;
  remainingCoursesCount: number;
  totalRequiredCoursesCount: number;
  overallPercentComplete: number;
  categories: {
    id: string;
    category: string;
    title: string;
    requiredCredits: number;
    completedCredits: number;
    inProgressCredits: number;
    plannedCredits: number;
    isSatisfied: boolean;
    courses: CourseAuditItem[];
  }[];
  yearLevels: YearLevelAudit[];
  allProgramCourses: CourseAuditItem[];
}

export function calculateDegreeProgress(
  semesters: Semester[],
  gradeRecords: GradeRecord[]
): DegreeProgressAudit {
  const completedGradesMap = new Map<string, { grade: LetterGrade; source?: 'sample' | 'student'; updatedAt?: string; credits: number }>();
  let totalCompletedCredits = 0;

  for (const gr of gradeRecords) {
    if (gr.grade !== 'F' && gr.grade !== 'IP') {
      completedGradesMap.set(gr.courseCode, {
        grade: gr.grade,
        source: gr.source || 'sample',
        updatedAt: gr.updatedAt,
        credits: gr.credits,
      });
      totalCompletedCredits += gr.credits;
    }
  }

  const inProgressCourseCodes = new Set<string>();
  const plannedCourseCodes = new Set<string>();
  let totalInProgressCredits = 0;
  let totalPlannedCredits = 0;

  for (const sem of semesters) {
    if (sem.isCompleted) continue;

    for (const cId of sem.courseIds) {
      const c = COURSE_BY_ID_MAP.get(cId);
      if (!c) continue;

      if (sem.isCurrent) {
        inProgressCourseCodes.add(c.code);
        totalInProgressCredits += c.credits;
      } else {
        plannedCourseCodes.add(c.code);
        totalPlannedCredits += c.credits;
      }
    }
  }

  // Collect all unique program course codes
  const uniqueProgramCodes = new Set<string>();
  for (const req of BS_CS_REQUIREMENTS) {
    for (const code of req.coursesList) {
      uniqueProgramCodes.add(code);
    }
  }

  const allProgramCourses: CourseAuditItem[] = [];

  for (const code of uniqueProgramCodes) {
    const course = COURSE_BY_CODE_MAP.get(code);
    const title = course ? course.title : code;
    const defaultCredits = course ? course.credits : 3;
    const level = (course?.level || 100) as 100 | 200 | 300 | 400;
    const yearLevel = (Math.max(1, Math.min(4, Math.floor(level / 100)))) as 1 | 2 | 3 | 4;

    let status: 'completed' | 'in-progress' | 'planned' | 'not-taken' = 'not-taken';
    let grade: LetterGrade | undefined;
    let source: 'sample' | 'student' | undefined;
    let updatedAt: string | undefined;
    let credits = defaultCredits;

    const gradeInfo = completedGradesMap.get(code);
    if (gradeInfo) {
      status = 'completed';
      grade = gradeInfo.grade;
      source = gradeInfo.source;
      updatedAt = gradeInfo.updatedAt;
      credits = gradeInfo.credits;
    } else if (inProgressCourseCodes.has(code)) {
      status = 'in-progress';
    } else if (plannedCourseCodes.has(code)) {
      status = 'planned';
    }

    allProgramCourses.push({
      code,
      title,
      credits,
      level,
      yearLevel,
      department: course?.department || 'GEN',
      termsOffered: course?.termsOffered || ['Fall', 'Spring'],
      prerequisites: course?.prerequisites || [],
      status,
      grade,
      source,
      updatedAt,
    });
  }

  // Calculate Categories
  const categories = BS_CS_REQUIREMENTS.map(req => {
    let completed = 0;
    let inProgress = 0;
    let planned = 0;

    const reqCourses: CourseAuditItem[] = [];

    for (const code of req.coursesList) {
      const item = allProgramCourses.find(c => c.code === code);
      if (item) {
        reqCourses.push(item);
        if (item.status === 'completed') completed += item.credits;
        else if (item.status === 'in-progress') inProgress += item.credits;
        else if (item.status === 'planned') planned += item.credits;
      }
    }

    const isSatisfied = completed >= req.requiredCredits;

    return {
      id: req.id,
      category: req.category,
      title: req.title,
      requiredCredits: req.requiredCredits,
      completedCredits: completed,
      inProgressCredits: inProgress,
      plannedCredits: planned,
      isSatisfied,
      courses: reqCourses,
    };
  });

  // Calculate Year Levels
  const yearLevelsConfig: { level: 1 | 2 | 3 | 4; name: string; title: string }[] = [
    { level: 1, name: 'First Year', title: 'First Year Foundations (43 Units)' },
    { level: 2, name: 'Second Year', title: 'Second Year Ecology & Chemistry (45 Units)' },
    { level: 3, name: 'Third Year', title: 'Third Year Management & Geospatial (51 Units)' },
    { level: 4, name: 'Fourth Year', title: 'Fourth Year Economics, Practicum & Thesis (29 Units)' },
  ];

  const yearLevels: YearLevelAudit[] = yearLevelsConfig.map(cfg => {
    const courses = allProgramCourses.filter(c => c.yearLevel === cfg.level);
    let totalCreds = 0;
    let completedCreds = 0;
    let inProgressCreds = 0;
    let plannedCreds = 0;

    for (const c of courses) {
      totalCreds += c.credits;
      if (c.status === 'completed') completedCreds += c.credits;
      else if (c.status === 'in-progress') inProgressCreds += c.credits;
      else if (c.status === 'planned') plannedCreds += c.credits;
    }

    const percent = totalCreds > 0 ? Math.min(100, Math.round((completedCreds / totalCreds) * 100)) : 0;

    return {
      level: cfg.level,
      name: cfg.name,
      title: cfg.title,
      totalCredits: totalCreds,
      completedCredits: completedCreds,
      inProgressCredits: inProgressCreds,
      plannedCredits: plannedCreds,
      percent,
      courses,
    };
  });

  const totalRequiredCoursesCount = uniqueProgramCodes.size;
  const completedCoursesCount = allProgramCourses.filter(c => c.status === 'completed').length;
  const remainingCoursesCount = Math.max(0, totalRequiredCoursesCount - completedCoursesCount);
  const remainingDegreeCredits = Math.max(0, TARGET_GRADUATION_CREDITS - totalCompletedCredits);

  const overallPercentComplete = Math.min(
    100,
    Math.round((totalCompletedCredits / TARGET_GRADUATION_CREDITS) * 100)
  );

  return {
    totalCompletedCredits,
    totalPlannedCredits,
    totalInProgressCredits,
    remainingDegreeCredits,
    completedCoursesCount,
    remainingCoursesCount,
    totalRequiredCoursesCount,
    overallPercentComplete,
    categories,
    yearLevels,
    allProgramCourses,
  };
}
