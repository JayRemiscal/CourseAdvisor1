export type TermType = 'Fall' | 'Spring' | 'Summer';

export type RequirementCategoryType = 
  | 'GenEd' 
  | 'MajorCore' 
  | 'MajorElective' 
  | 'MathScience' 
  | 'Capstone' 
  | 'FreeElective'
  | 'Mandated'
  | 'PracticumThesis';

export type LetterGrade = '1.0' | '1.25' | '1.5' | '1.75' | '2.0' | '2.25' | '2.5' | '2.75' | '3.0' | '5.0' | 'INC' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F' | 'IP' | 'P';

export interface Course {
  id: string;
  code: string;
  title: string;
  department: string;
  credits: number; // Units in the prospectus
  lectureHours?: number;
  labHours?: number;
  level: 100 | 200 | 300 | 400;
  yearLevel?: number; // 1, 2, 3, 4
  semester?: TermType; // Recommended term/semester
  difficultyRating?: number; // 1 to 10
  description: string;
  prerequisites: string[]; // List of course codes e.g. ["PHY012"]
  corequisites: string[];
  minGradePrereq?: string;
  termsOffered: TermType[];
  requirementCategory: RequirementCategoryType;
  difficulty: number; // 1 to 5
  weeklyHours: {
    lecture: number;
    lab: number;
    study: number;
  };
  projectIntensity: 'Low' | 'Medium' | 'High';
  examRigor: 'Low' | 'Medium' | 'High';
  tags: string[];
}

export interface Semester {
  id: string;
  name: string;
  term: TermType;
  year: number; // 1, 2, 3, 4
  academicYear: string; // e.g. "2024-2025"
  courseIds: string[];
  isCompleted?: boolean;
  isCurrent?: boolean;
}

export interface AcademicPlan {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
  semesters: Semester[];
}

export interface GradeRecord {
  courseCode: string;
  grade: LetterGrade;
  term: string;
  credits: number;
  source?: 'sample' | 'student';
  updatedAt?: string;
}

export interface AcademicActivity {
  id: string;
  type: 'grade_recorded' | 'status_updated' | 'plan_modified' | 'milestone_reached';
  title: string;
  description: string;
  timestamp: string;
  source: 'sample' | 'student';
}

export interface StudentProfile {
  name: string;
  studentId: string;
  university: string;
  email: string;
  major: string;
  minor: string;
  catalogYear: string;
  targetGradTerm: TermType;
  targetGradYear: number;
  targetGpa: number;
  maxWeeklyHoursLimit: number;
  maxCreditsPerTerm: number;
}

export interface DegreeRequirement {
  id: string;
  category: RequirementCategoryType;
  title: string;
  requiredCredits: number;
  description: string;
  coursesList: string[]; // Course codes belonging to this requirement
  minLevel?: number;
}

export interface PrerequisiteDetail {
  prereqCode: string;
  prereqTitle: string;
  satisfied: boolean;
  status: 'completed' | 'in-progress' | 'prior-semester' | 'concurrent' | 'missing';
  message: string;
}

export interface PrerequisiteValidationResult {
  courseCode: string;
  satisfied: boolean;
  missingPrereqs: string[];
  details: PrerequisiteDetail[];
}

export interface WorkloadSummary {
  totalCredits: number;
  lectureHours: number;
  labHours: number;
  studyHours: number;
  totalWeeklyHours: number;
  difficultyScore: number;
  burnoutRisk: 'Low' | 'Moderate' | 'Heavy' | 'Extreme';
  projectCount: number;
  examRigorCount: number;
  recommendations: string[];
}

export interface AutoPlanningInputs {
  degreeProgram: string;
  currentYearLevel: number;
  startingTerm: TermType;
  startingYear: number;
  startingAcademicYear: string;
  targetCreditsPerSemester: number;
  planningHorizonSemesters: number; // e.g. 2, 4, 6, 8 (or 0 for all remaining to graduation)
  includeSummerTerms: boolean;
  includeCompletedForReview: boolean;
}

export interface CoursePlacementExplanation {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  semesterId: string;
  semesterName: string;
  tier: number;
  unlocksCount: number;
  unlockedCourses: string[];
  prerequisites: string[];
  reason: string;
  isGatewayOrSummer?: boolean;
}

export interface MoveValidationResult {
  isValid: boolean;
  conflictType?: 'prereq_missing' | 'prereq_same_or_later' | 'downstream_broken' | 'duplicate_course' | 'credit_overload';
  message: string;
  conflictingCourses: string[];
  suggestedAction?: string;
}

export interface GeneratedPlanResult {
  plan: AcademicPlan;
  explanations: Record<string, CoursePlacementExplanation>;
  unscheduledCourses: Array<{ course: Course; reason: string }>;
  assumptions: string[];
  totalPlannedCredits: number;
  totalTerms: number;
}
