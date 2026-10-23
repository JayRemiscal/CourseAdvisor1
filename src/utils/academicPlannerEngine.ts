import { 
  Course, 
  AcademicPlan, 
  Semester, 
  GradeRecord, 
  AutoPlanningInputs, 
  GeneratedPlanResult, 
  CoursePlacementExplanation, 
  MoveValidationResult,
  TermType
} from '../types/academic';
import { COURSES_DATA, COURSE_BY_ID_MAP, COURSE_BY_CODE_MAP } from '../data/coursesData';
import { computeKahnTopologicalSort, detectGraphCycles } from './prerequisiteEngine';
import { TARGET_GRADUATION_CREDITS } from '../data/degreeRequirements';

/**
 * Calculates unlock counts and sets of dependents for each course in the catalog.
 */
export function calculateCourseUnlocks(courses: Course[] = COURSES_DATA): Map<string, { count: number; dependents: string[] }> {
  const unlockMap = new Map<string, { count: number; dependents: string[] }>();
  
  for (const c of courses) {
    unlockMap.set(c.code, { count: 0, dependents: [] });
  }

  for (const c of courses) {
    for (const prereq of c.prerequisites) {
      if (unlockMap.has(prereq)) {
        const item = unlockMap.get(prereq)!;
        item.count += 1;
        item.dependents.push(c.code);
      }
    }
  }

  return unlockMap;
}

/**
 * Generates an automatic, term-by-term academic course schedule
 * using the student's inputs, progress data, and Kahn's topological sort.
 */
export function generateAutomaticPlan(
  inputs: AutoPlanningInputs,
  studentGradeRecords: GradeRecord[],
  existingSemesters?: Semester[]
): GeneratedPlanResult {
  const assumptions: string[] = [
    'MSU-Naawan BSES Curriculum Prospectus (BOR Res. 357 S. 2018 / APC Res. 34 S. 2018; 168 Units) used as standard degree baseline.',
    "Kahn's topological sort determines prerequisite tiers and valid linear course progression; no course is placed prior to or concurrent with prerequisites.",
    `Target credit load is set to ~${inputs.targetCreditsPerSemester} units per regular semester to prevent academic overload.`,
    'Course placement prioritizes unlocking downstream prerequisite dependencies (critical path) and natural prospectus semester alignment.',
    'Transparent heuristic: this plan uses topological tiering and bin-packing rather than a black-box mathematical optimizer.',
    'Courses assume standard seasonal university offering (1st Semester / 2nd Semester / Summer Gateway).'
  ];

  // 1. Identify completed and in-progress courses from student records
  const completedCodes = new Set(
    studentGradeRecords
      .filter(r => r.grade !== 'F' && r.grade !== 'IP')
      .map(r => r.courseCode)
  );

  const inProgressCodes = new Set(
    studentGradeRecords
      .filter(r => r.grade === 'IP')
      .map(r => r.courseCode)
  );

  // 2. Compute topological sort and dependency tiers
  const topoResult = computeKahnTopologicalSort(COURSES_DATA);
  const unlocksMap = calculateCourseUnlocks(COURSES_DATA);

  // Map each course code to its Kahn's tier index
  const courseTierMap = new Map<string, number>();
  topoResult.tiers.forEach(tier => {
    tier.courses.forEach(c => {
      courseTierMap.set(c.code, tier.tierIndex);
    });
  });

  // 3. Determine courses to schedule
  // Exclude completed courses unless student requested review
  const coursesToSchedule: Course[] = COURSES_DATA.filter(course => {
    if (completedCodes.has(course.code)) {
      return false; // already completed
    }
    return true;
  });

  // 4. Determine terms/semesters to generate
  const generatedSemesters: Semester[] = [];
  const explanations: Record<string, CoursePlacementExplanation> = {};
  const unscheduledCourses: Array<{ course: Course; reason: string }> = [];

  // Determine horizon length:
  // If inputs.planningHorizonSemesters is 0 (or >= 8), calculate based on remaining credits
  const totalRemainingCredits = coursesToSchedule.reduce((acc, c) => acc + c.credits, 0);
  const estimatedTermsNeeded = Math.ceil(totalRemainingCredits / Math.max(12, inputs.targetCreditsPerSemester));
  
  const horizonCount = inputs.planningHorizonSemesters > 0
    ? inputs.planningHorizonSemesters
    : Math.max(6, estimatedTermsNeeded);

  // Generate term slots
  let currentYear = inputs.startingYear || inputs.currentYearLevel || 1;
  let currentTermSeason: TermType = inputs.startingTerm || 'Fall';
  let startCalYear = parseInt(inputs.startingAcademicYear.split('–')[0] || inputs.startingAcademicYear.split('-')[0] || '2025', 10);
  if (isNaN(startCalYear)) startCalYear = 2025;

  // If student wants completed courses included as historical terms:
  if (inputs.includeCompletedForReview && existingSemesters && existingSemesters.length > 0) {
    const completedSemesters = existingSemesters.filter(s => s.isCompleted);
    for (const cSem of completedSemesters) {
      generatedSemesters.push({ ...cSem });
    }
  }

  // Build future term descriptors
  for (let t = 0; t < horizonCount; t++) {
    const semId = `gen-sem-${currentYear}-${currentTermSeason.toLowerCase()}-${Date.now()}-${t}`;
    const termLabel = currentTermSeason === 'Fall' ? '1st Semester' : currentTermSeason === 'Spring' ? '2nd Semester' : 'Summer';
    const acadYearStr = `${startCalYear}–${startCalYear + 1}`;
    
    generatedSemesters.push({
      id: semId,
      name: `Year ${currentYear} · ${termLabel}`,
      term: currentTermSeason,
      year: currentYear,
      academicYear: acadYearStr,
      courseIds: [],
      isCompleted: false,
      isCurrent: t === 0 && inProgressCodes.size > 0,
    });

    // Advance term
    if (currentTermSeason === 'Fall') {
      currentTermSeason = 'Spring';
    } else if (currentTermSeason === 'Spring') {
      if (inputs.includeSummerTerms || (currentYear === 3)) {
        currentTermSeason = 'Summer';
      } else {
        currentTermSeason = 'Fall';
        currentYear += 1;
        startCalYear += 1;
      }
    } else if (currentTermSeason === 'Summer') {
      currentTermSeason = 'Fall';
      currentYear += 1;
      startCalYear += 1;
    }
  }

  // 5. Track satisfied prerequisites as we schedule term by term
  const satisfiedCodes = new Set<string>(completedCodes);
  
  // Also track courses placed in prior generated terms
  const scheduledCourseCodes = new Set<string>();

  // Helper to determine term season matching
  const getSeasonMatchScore = (c: Course, termSeason: TermType): number => {
    if (c.termsOffered && c.termsOffered.includes(termSeason)) return 10;
    if (c.termsOffered && c.termsOffered.includes('Summer') && termSeason === 'Summer') return 20;
    if (termSeason === 'Summer' && c.code === 'ENS035') return 50; // Year 3 Summer gateway
    if (termSeason === 'Summer' && c.code === 'GEC123') return 30;
    return 0;
  };

  // 6. Schedule courses term by term
  for (let sIdx = 0; sIdx < generatedSemesters.length; sIdx++) {
    const semester = generatedSemesters[sIdx];
    if (semester.isCompleted) {
      // Already filled historical semester
      continue;
    }

    const isSummerTerm = semester.term === 'Summer';
    const termCreditCap = isSummerTerm ? 8 : (inputs.targetCreditsPerSemester || 18);
    let termCredits = 0;

    // Identify candidate courses whose prerequisites are ALL satisfied before this term
    const candidates: Course[] = [];

    for (const course of coursesToSchedule) {
      if (scheduledCourseCodes.has(course.code)) continue;

      // Special rule: if it's summer, only place summer designated courses or gateway courses
      if (isSummerTerm) {
        const isSummerEligible = course.termsOffered?.includes('Summer') || course.code === 'ENS035' || course.code === 'GEC123';
        if (!isSummerEligible) {
          continue;
        }
      }

      // Check all prerequisites
      const allPrereqsMet = course.prerequisites.every(p => satisfiedCodes.has(p));
      if (allPrereqsMet) {
        candidates.push(course);
      }
    }

    // Sort candidates by:
    // 1. Summer specific gateway priority
    // 2. Year level matching (closer to student's year)
    // 3. Unlocks count (critical path unlockers first)
    // 4. Season match score
    // 5. Lower tier first
    // 6. Difficulty balance
    candidates.sort((a, b) => {
      const aUnlock = unlocksMap.get(a.code)?.count || 0;
      const bUnlock = unlocksMap.get(b.code)?.count || 0;
      const aSeason = getSeasonMatchScore(a, semester.term);
      const bSeason = getSeasonMatchScore(b, semester.term);
      const aYear = a.yearLevel || Math.floor(a.level / 100);
      const bYear = b.yearLevel || Math.floor(b.level / 100);
      const aYearDiff = Math.abs(aYear - semester.year);
      const bYearDiff = Math.abs(bYear - semester.year);

      // Prioritize same year level
      if (aYearDiff !== bYearDiff) return aYearDiff - bYearDiff;
      // Prioritize seasonal match
      if (aSeason !== bSeason) return bSeason - aSeason;
      // Prioritize high unlock courses (clears blockers for later terms)
      if (aUnlock !== bUnlock) return bUnlock - aUnlock;
      // Prioritize lower tier
      const aTier = courseTierMap.get(a.code) ?? 0;
      const bTier = courseTierMap.get(b.code) ?? 0;
      if (aTier !== bTier) return aTier - bTier;

      return (b.credits) - (a.credits);
    });

    // Bin pack into current semester
    const termCourseCodes: string[] = [];

    for (const course of candidates) {
      // Check if adding this course fits within cap (allowing slight tolerance of +1 or +2 to not leave orphans)
      if (termCredits + course.credits <= termCreditCap + 1 || termCourseCodes.length === 0) {
        // Add course
        termCourseCodes.push(course.code);
        termCredits += course.credits;
        scheduledCourseCodes.add(course.code);

        // Generate explanation
        const tier = courseTierMap.get(course.code) ?? 0;
        const unlocks = unlocksMap.get(course.code);
        const unlocksCount = unlocks?.count || 0;
        const unlockedCourses = unlocks?.dependents || [];
        const courseYear = course.yearLevel || Math.floor(course.level / 100);

        let reason = '';
        if (course.prerequisites.length === 0) {
          reason = `Foundational course (Tier ${tier}) with no prerequisites. Scheduled early to unlock ${unlocksCount} subsequent degree requirement(s).`;
        } else {
          reason = `All prerequisites (${course.prerequisites.join(', ')}) satisfied in prior terms. Scheduled in ${semester.name} adhering to ${courseYear === semester.year ? 'normal curriculum progression' : 'accelerated sequencing'}.`;
        }

        if (course.code === 'ENS035') {
          reason = 'Official Year 3 Summer Gateway: Environmental Impact Assessment & Field Camp (5 units), prerequisite to senior research thesis.';
        } else if (course.code === 'ENS198' || course.code === 'ENS199') {
          reason = 'Senior Capstone & Thesis: Scheduled in final year after completing core environmental science research methodology prerequisites.';
        } else if (unlocksCount >= 3) {
          reason += ` Critical path course: unlocks ${unlocksCount} downstream courses (${unlockedCourses.slice(0, 3).join(', ')}).`;
        }

        explanations[course.id] = {
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          semesterId: semester.id,
          semesterName: semester.name,
          tier,
          unlocksCount,
          unlockedCourses,
          prerequisites: course.prerequisites,
          reason,
          isGatewayOrSummer: course.code === 'ENS035' || (course.termsOffered && course.termsOffered.includes('Summer')),
        };

        if (termCredits >= termCreditCap) {
          break; // Term full
        }
      }
    }

    // Assign courses to semester
    semester.courseIds = termCourseCodes.map(code => COURSE_BY_CODE_MAP.get(code)?.id || code);

    // After this semester is finalized, all its courses are now satisfied for future semesters
    for (const cCode of termCourseCodes) {
      satisfiedCodes.add(cCode);
    }
  }

  // 7. Check for unscheduled courses
  for (const course of coursesToSchedule) {
    if (!scheduledCourseCodes.has(course.code)) {
      const tier = courseTierMap.get(course.code) ?? 0;
      const missingPrereqs = course.prerequisites.filter(p => !satisfiedCodes.has(p));
      
      let reason = '';
      if (missingPrereqs.length > 0) {
        reason = `Prerequisite sequence chain extends beyond available planning terms. Missing earlier prerequisites: ${missingPrereqs.join(', ')}.`;
      } else {
        reason = `Planning horizon limit reached (${horizonCount} terms). Course fits within standard 168-credit degree, but requires additional subsequent terms to complete within the ${inputs.targetCreditsPerSemester}-credit cap.`;
      }

      unscheduledCourses.push({
        course,
        reason,
      });
    }
  }

  // 8. Construct final AcademicPlan object
  const totalPlannedCredits = generatedSemesters.reduce((acc, sem) => {
    return acc + sem.courseIds.reduce((cAcc, cId) => {
      const c = COURSE_BY_ID_MAP.get(cId);
      return cAcc + (c?.credits || 0);
    }, 0);
  }, 0);

  const planName = `Generated Plan (${inputs.targetCreditsPerSemester} cr/term · Horizon ${horizonCount} Terms)`;
  const planDescription = `Algorithmic curriculum sequence generated on ${new Date().toLocaleDateString()} using Kahn's topological tier ordering for MSU-Naawan BSES (Target: ${inputs.targetCreditsPerSemester} credits/term).`;

  const newPlan: AcademicPlan = {
    id: `plan-auto-${Date.now()}`,
    name: planName,
    description: planDescription,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    semesters: generatedSemesters,
  };

  return {
    plan: newPlan,
    explanations,
    unscheduledCourses,
    assumptions,
    totalPlannedCredits,
    totalTerms: generatedSemesters.length,
  };
}

/**
 * Validates moving a course from one semester to another in an academic plan.
 * Verifies both prerequisite readiness (backward dependency) and downstream validity (forward dependency).
 */
export function validateCourseMove(
  courseId: string,
  fromSemesterId: string,
  toSemesterId: string,
  plan: AcademicPlan,
  studentGradeRecords: GradeRecord[]
): MoveValidationResult {
  if (fromSemesterId === toSemesterId) {
    return {
      isValid: true,
      message: 'Course dropped into the same semester; no position change.',
      conflictingCourses: [],
    };
  }

  const course = COURSE_BY_ID_MAP.get(courseId);
  if (!course) {
    return {
      isValid: false,
      message: `Course with ID ${courseId} not found in catalog.`,
      conflictingCourses: [],
    };
  }

  const targetSemester = plan.semesters.find(s => s.id === toSemesterId);
  const sourceSemester = plan.semesters.find(s => s.id === fromSemesterId);
  if (!targetSemester || !sourceSemester) {
    return {
      isValid: false,
      message: 'Target or source semester was not found in the active plan.',
      conflictingCourses: [],
    };
  }

  // 1. Check for duplicate course in target semester
  if (targetSemester.courseIds.includes(courseId)) {
    return {
      isValid: false,
      conflictType: 'duplicate_course',
      message: `Course ${course.code} (${course.title}) is already scheduled in ${targetSemester.name}. A course cannot be scheduled twice in the same semester.`,
      conflictingCourses: [course.code],
      suggestedAction: 'Remove duplicate or select a different semester.',
    };
  }

  const targetIdx = plan.semesters.findIndex(s => s.id === toSemesterId);
  const sourceIdx = plan.semesters.findIndex(s => s.id === fromSemesterId);

  // Set of completed courses from permanent academic history
  const passedCodes = new Set(
    studentGradeRecords
      .filter(r => r.grade !== 'F' && r.grade !== 'IP')
      .map(r => r.courseCode)
  );

  // Collect courses scheduled strictly prior to the target semester
  const priorCodes = new Set<string>(passedCodes);
  for (let i = 0; i < targetIdx; i++) {
    for (const cId of plan.semesters[i].courseIds) {
      if (cId === courseId) continue; // ignore the moving course itself
      const c = COURSE_BY_ID_MAP.get(cId);
      if (c) priorCodes.add(c.code);
    }
  }

  // Collect courses in the target semester itself
  const sameSemesterCodes = new Set<string>();
  for (const cId of targetSemester.courseIds) {
    const c = COURSE_BY_ID_MAP.get(cId);
    if (c) sameSemesterCodes.add(c.code);
  }

  // 2. Validate prerequisites of the moving course
  for (const prereqCode of course.prerequisites) {
    // If prerequisite is in the same semester -> invalid unless approved corequisite
    if (sameSemesterCodes.has(prereqCode)) {
      const isApprovedCoreq = course.corequisites && course.corequisites.includes(prereqCode);
      if (!isApprovedCoreq) {
        return {
          isValid: false,
          conflictType: 'prereq_same_or_later',
          message: `Prerequisite Conflict: ${course.code} requires ${prereqCode}, which is scheduled in the same semester (${targetSemester.name}). Prerequisites must be passed in an earlier term.`,
          conflictingCourses: [prereqCode],
          suggestedAction: `Move prerequisite ${prereqCode} to a prior semester before placing ${course.code} here.`,
        };
      }
    }

    // If prerequisite is neither passed nor scheduled in a strictly prior semester
    if (!priorCodes.has(prereqCode)) {
      // Find where the prerequisite is currently placed (if any)
      const laterSemester = plan.semesters.find((s, idx) => {
        if (idx <= targetIdx) return false;
        return s.courseIds.some(cId => {
          const c = COURSE_BY_ID_MAP.get(cId);
          return c?.code === prereqCode;
        });
      });

      if (laterSemester) {
        return {
          isValid: false,
          conflictType: 'prereq_same_or_later',
          message: `Prerequisite Sequencing Error: ${course.code} requires ${prereqCode}, but ${prereqCode} is scheduled later in ${laterSemester.name}. A prerequisite cannot be taken after the course that requires it.`,
          conflictingCourses: [prereqCode],
          suggestedAction: `Schedule ${prereqCode} in an earlier semester prior to ${targetSemester.name}.`,
        };
      }

      return {
        isValid: false,
        conflictType: 'prereq_missing',
        message: `Unsatisfied Prerequisite: ${course.code} requires ${prereqCode}, which has not been completed or scheduled in any earlier term.`,
        conflictingCourses: [prereqCode],
        suggestedAction: `Add prerequisite ${prereqCode} to an earlier semester first.`,
      };
    }
  }

  // 3. Validate downstream dependent courses:
  // If moving course to a later semester (targetIdx > sourceIdx), check whether any courses
  // in semesters between sourceIdx and targetIdx depend on this course!
  if (targetIdx > sourceIdx) {
    const brokenDependents: Array<{ code: string; semesterName: string }> = [];

    for (let i = sourceIdx; i <= targetIdx; i++) {
      const sem = plan.semesters[i];
      for (const cId of sem.courseIds) {
        if (cId === courseId) continue;
        const depCourse = COURSE_BY_ID_MAP.get(cId);
        if (depCourse && depCourse.prerequisites.includes(course.code)) {
          brokenDependents.push({ code: depCourse.code, semesterName: sem.name });
        }
      }
    }

    if (brokenDependents.length > 0) {
      const depList = brokenDependents.map(d => `${d.code} (${d.semesterName})`).join(', ');
      return {
        isValid: false,
        conflictType: 'downstream_broken',
        message: `Dependency Chain Conflict: Moving ${course.code} to ${targetSemester.name} breaks the prerequisite chain for: ${depList}. These courses require ${course.code} to be completed before them.`,
        conflictingCourses: brokenDependents.map(d => d.code),
        suggestedAction: `Move the dependent course(s) to a later semester after ${targetSemester.name} first.`,
      };
    }
  }

  // 4. Calculate workload and credit load impact
  const currentTargetCredits = targetSemester.courseIds.reduce((acc, cId) => {
    return acc + (COURSE_BY_ID_MAP.get(cId)?.credits || 0);
  }, 0);
  const newTargetCredits = currentTargetCredits + course.credits;

  if (newTargetCredits > 26) {
    return {
      isValid: false,
      conflictType: 'credit_overload',
      message: `Extreme Credit Overload: Moving ${course.code} (+${course.credits} cr) into ${targetSemester.name} raises total credits to ${newTargetCredits} cr, exceeding the university maximum term load (24–26 cr).`,
      conflictingCourses: [course.code],
      suggestedAction: 'Remove or reschedule another course from this semester to balance the credit load.',
    };
  }

  return {
    isValid: true,
    message: `Valid move: ${course.code} can be scheduled in ${targetSemester.name}. Total credits will be ${newTargetCredits} cr.`,
    conflictingCourses: [],
  };
}
