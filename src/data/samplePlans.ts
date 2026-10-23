import { AcademicPlan, GradeRecord, StudentProfile, AcademicActivity } from '../types/academic';

export const DEFAULT_STUDENT_PROFILE: StudentProfile = {
  name: 'Reymart D. Alcantara',
  studentId: 'MSUN-2025-0482',
  university: 'Mindanao State University at Naawan',
  email: 'reymart.alcantara@msunaawan.edu.ph',
  major: 'Bachelor of Science in Environmental Science',
  minor: 'Coastal Ecology & GIS Concentration',
  catalogYear: 'SY 2025–2026',
  targetGradTerm: 'Spring',
  targetGradYear: 2029,
  targetGpa: 3.78,
  maxWeeklyHoursLimit: 48,
  maxCreditsPerTerm: 24,
};

export const INITIAL_GRADE_RECORDS: GradeRecord[] = [
  // First Year, First Semester (23 units completed)
  { courseCode: 'GEC101', grade: 'A', term: 'Y1-1st Sem', credits: 3, source: 'sample' },
  { courseCode: 'GEC102', grade: 'A', term: 'Y1-1st Sem', credits: 3, source: 'sample' },
  { courseCode: 'GEC120', grade: 'A-', term: 'Y1-1st Sem', credits: 3, source: 'sample' },
  { courseCode: 'MAT051', grade: 'B+', term: 'Y1-1st Sem', credits: 5, source: 'sample' },
  { courseCode: 'ENS011', grade: 'A', term: 'Y1-1st Sem', credits: 3, source: 'sample' },
  { courseCode: 'Physics 11', grade: 'B+', term: 'Y1-1st Sem', credits: 3, source: 'sample' },
  { courseCode: 'Physics 11.1', grade: 'A', term: 'Y1-1st Sem', credits: 1, source: 'sample' },
  { courseCode: 'PED011', grade: 'A', term: 'Y1-1st Sem', credits: 2, source: 'sample' },
  { courseCode: 'NST001', grade: 'A', term: 'Y1-1st Sem', credits: 3, source: 'sample' },

  // First Year, Second Semester (20 units completed)
  { courseCode: 'GEC103', grade: 'A', term: 'Y1-2nd Sem', credits: 3, source: 'sample' },
  { courseCode: 'GEC104', grade: 'A-', term: 'Y1-2nd Sem', credits: 3, source: 'sample' },
  { courseCode: 'GEC105', grade: 'A', term: 'Y1-2nd Sem', credits: 3, source: 'sample' },
  { courseCode: 'GEC110', grade: 'A', term: 'Y1-2nd Sem', credits: 3, source: 'sample' },
  { courseCode: 'GEC130', grade: 'A', term: 'Y1-2nd Sem', credits: 3, source: 'sample' },
  { courseCode: 'PHY012', grade: 'A', term: 'Y1-2nd Sem', credits: 3, source: 'sample' },
  { courseCode: 'PED012', grade: 'A', term: 'Y1-2nd Sem', credits: 2, source: 'sample' },
  { courseCode: 'NST002', grade: 'A', term: 'Y1-2nd Sem', credits: 3, source: 'sample' },
];

export const INITIAL_ACTIVITIES: AcademicActivity[] = [
  {
    id: 'act-1',
    type: 'status_updated',
    title: 'Enrolled in Second Year, First Semester',
    description: 'Enrolled in Fundamentals of Ecology, Surveying & Remote Sensing, Chemistry, and PATHFIT 3 (23 units).',
    timestamp: 'August 18, 2026',
    source: 'sample'
  },
  {
    id: 'act-2',
    type: 'grade_recorded',
    title: 'Grades Posted: First Year, Second Semester',
    description: 'Completed 20 units with GWA of 1.35 (Dean’s Honor Roll standing).',
    timestamp: 'June 2, 2026',
    source: 'sample'
  },
  {
    id: 'act-3',
    type: 'milestone_reached',
    title: 'First Year Environmental Science Clearance',
    description: 'Cleared 43 total academic units under BOR Resolution No. 357, S. 2017.',
    timestamp: 'June 10, 2026',
    source: 'sample'
  },
  {
    id: 'act-4',
    type: 'plan_modified',
    title: 'Curriculum Plan Verified',
    description: 'Official MSU-Naawan 4-Year BSES Prospectus synchronized for SY 2025–2026.',
    timestamp: 'July 5, 2026',
    source: 'sample'
  }
];

export const SAMPLE_PLANS: AcademicPlan[] = [
  {
    id: 'plan-msun-bses-official',
    name: 'MSU-Naawan Official BSES Prospectus (SY 2025–2026)',
    description: 'Prescribed curriculum for Bachelor of Science in Environmental Science (BOR Res. No. 357, S. 2017 / APC Res. No. 022 Series of 2025).',
    createdAt: '2025-08-01T08:00:00Z',
    updatedAt: '2026-10-16T12:00:00Z',
    isDefault: true,
    semesters: [
      {
        id: 'sem-y1-1st',
        name: 'First Year · 1st Semester',
        term: 'Fall',
        year: 1,
        academicYear: '2025–2026',
        courseIds: [
          'gec-101',
          'gec-102',
          'gec-120',
          'mat-051',
          'ens-011',
          'physics-11',
          'physics-11-1',
          'ped-011',
          'nst-001'
        ],
        isCompleted: true,
      },
      {
        id: 'sem-y1-2nd',
        name: 'First Year · 2nd Semester',
        term: 'Spring',
        year: 1,
        academicYear: '2025–2026',
        courseIds: [
          'gec-103',
          'gec-104',
          'gec-105',
          'gec-110',
          'gec-130',
          'phy-012',
          'ped-012',
          'nst-002'
        ],
        isCompleted: true,
      },
      {
        id: 'sem-y2-1st',
        name: 'Second Year · 1st Semester',
        term: 'Fall',
        year: 2,
        academicYear: '2026–2027',
        courseIds: [
          'bio-021',
          'gec-106',
          'gec-107',
          'ens-022',
          'ens-024',
          'chm-043',
          'chm-043-1',
          'ped-013'
        ],
        isCurrent: true,
      },
      {
        id: 'sem-y2-2nd',
        name: 'Second Year · 2nd Semester',
        term: 'Spring',
        year: 2,
        academicYear: '2026–2027',
        courseIds: [
          'gec-108',
          'gec-109',
          'bio-023',
          'chm-053',
          'chm-053-1',
          'fpe-101',
          'stt-050',
          'stt-050-1',
          'ped-014'
        ],
      },
      {
        id: 'sem-y3-1st',
        name: 'Third Year · 1st Semester',
        term: 'Fall',
        year: 3,
        academicYear: '2027–2028',
        courseIds: [
          'bio-031',
          'ens-032',
          'chm-033',
          'ens-037',
          'ens-038',
          'ens-039',
          'csc-011'
        ],
      },
      {
        id: 'sem-y3-2nd',
        name: 'Third Year · 2nd Semester',
        term: 'Spring',
        year: 3,
        academicYear: '2027–2028',
        courseIds: [
          'bio-034',
          'chm-036',
          'ens-105',
          'ens-119',
          'ens-198',
          'mat-038',
          'ens-041'
        ],
      },
      {
        id: 'sem-y3-summer',
        name: 'Third Year · Summer',
        term: 'Summer',
        year: 3,
        academicYear: '2027–2028',
        courseIds: [
          'ens-035',
          'gec-123'
        ],
      },
      {
        id: 'sem-y4-1st',
        name: 'Fourth Year · 1st Semester',
        term: 'Fall',
        year: 4,
        academicYear: '2028–2029',
        courseIds: [
          'ens-042',
          'ens-043',
          'ens-044',
          'ens-045',
          'ens-117',
          'crs-001',
          'ens-199'
        ],
      },
      {
        id: 'sem-y4-2nd',
        name: 'Fourth Year · 2nd Semester',
        term: 'Spring',
        year: 4,
        academicYear: '2028–2029',
        courseIds: [
          'ens-196',
          'ens-197'
        ],
      },
    ],
  },
  {
    id: 'plan-accelerated-bses',
    name: 'BSES Research & Field Honors Track',
    description: 'Prioritizes early GIS geospatial analysis and pre-thesis research clearance for accelerated field practicum.',
    createdAt: '2025-09-10T10:00:00Z',
    updatedAt: '2026-10-15T15:30:00Z',
    semesters: [
      {
        id: 'sem-acc-y1-1st',
        name: 'First Year · 1st Semester',
        term: 'Fall',
        year: 1,
        academicYear: '2025–2026',
        courseIds: ['gec-101', 'gec-102', 'gec-120', 'mat-051', 'ens-011', 'physics-11', 'physics-11-1', 'ped-011', 'nst-001'],
        isCompleted: true,
      },
      {
        id: 'sem-acc-y1-2nd',
        name: 'First Year · 2nd Semester',
        term: 'Spring',
        year: 1,
        academicYear: '2025–2026',
        courseIds: ['gec-103', 'gec-104', 'gec-105', 'gec-110', 'gec-130', 'phy-012', 'ped-012', 'nst-002'],
        isCompleted: true,
      },
      {
        id: 'sem-acc-y2-1st',
        name: 'Second Year · 1st Semester',
        term: 'Fall',
        year: 2,
        academicYear: '2026–2027',
        courseIds: ['bio-021', 'gec-106', 'gec-107', 'ens-022', 'ens-024', 'chm-043', 'chm-043-1', 'ped-013'],
        isCurrent: true,
      },
      {
        id: 'sem-acc-y2-2nd',
        name: 'Second Year · 2nd Semester',
        term: 'Spring',
        year: 2,
        academicYear: '2026–2027',
        courseIds: ['gec-108', 'gec-109', 'bio-023', 'chm-053', 'chm-053-1', 'fpe-101', 'stt-050', 'stt-050-1', 'ped-014'],
      },
      {
        id: 'sem-acc-y3-1st',
        name: 'Third Year · 1st Semester',
        term: 'Fall',
        year: 3,
        academicYear: '2027–2028',
        courseIds: ['bio-031', 'ens-032', 'chm-033', 'ens-037', 'ens-038', 'ens-039', 'csc-011'],
      },
      {
        id: 'sem-acc-y3-2nd',
        name: 'Third Year · 2nd Semester',
        term: 'Spring',
        year: 3,
        academicYear: '2027–2028',
        courseIds: ['bio-034', 'chm-036', 'ens-105', 'ens-119', 'ens-198', 'mat-038', 'ens-041'],
      },
      {
        id: 'sem-acc-y3-summer',
        name: 'Third Year · Summer',
        term: 'Summer',
        year: 3,
        academicYear: '2027–2028',
        courseIds: ['ens-035', 'gec-123'],
      },
      {
        id: 'sem-acc-y4-1st',
        name: 'Fourth Year · 1st Semester',
        term: 'Fall',
        year: 4,
        academicYear: '2028–2029',
        courseIds: ['ens-042', 'ens-043', 'ens-044', 'ens-045', 'ens-117', 'crs-001', 'ens-199'],
      },
      {
        id: 'sem-acc-y4-2nd',
        name: 'Fourth Year · 2nd Semester',
        term: 'Spring',
        year: 4,
        academicYear: '2028–2029',
        courseIds: ['ens-196', 'ens-197'],
      },
    ],
  },
];
