import { DegreeRequirement } from '../types/academic';

/**
 * Official Degree Requirements for:
 * Bachelor of Science in Environmental Science (BSES)
 * Mindanao State University at Naawan
 * BOR Resolution No.: 357, S. 2017 | APC Resolution No.: 022 Series of 2025
 * Effectivity: SY 2025–2026 | References: CMO No. 35 Series of 2005
 */
export const BS_CS_REQUIREMENTS: DegreeRequirement[] = [
  {
    id: 'req-gened',
    category: 'GenEd',
    title: 'General Education Curriculum & Peace Studies',
    requiredCredits: 39,
    description: 'CHED mandated general education courses including Understanding the Self, Purposive Communication, Philippine History, MINSUPALA Studies, Rizal, STS, and Peace Education.',
    coursesList: [
      'GEC101',
      'GEC102',
      'GEC120',
      'GEC103',
      'GEC104',
      'GEC105',
      'GEC110',
      'GEC130',
      'GEC106',
      'GEC107',
      'GEC108',
      'GEC109',
      'FPE101',
      'GEC123'
    ]
  },
  {
    id: 'req-mandated',
    category: 'Mandated',
    title: 'Physical Education (PATHFIT) & National Service (NSTP)',
    requiredCredits: 14,
    description: 'Movement competency, exercise fitness, sports, outdoor adventure (PATHFIT 1-4) and civic community development (NSTP 1-2).',
    coursesList: [
      'PED011',
      'PED012',
      'PED013',
      'PED014',
      'NST001',
      'NST002'
    ]
  },
  {
    id: 'req-math-sci',
    category: 'MathScience',
    title: 'Basic Natural Sciences, Mathematics & Computing Foundation',
    requiredCredits: 30,
    description: 'Calculus, introductory physics with laboratory, inorganic/organic chemistry, general biochemistry, environmental statistics, and scientific programming.',
    coursesList: [
      'MAT051',
      'Physics 11',
      'Physics 11.1',
      'CHM043',
      'CHM043.1',
      'CHM053',
      'CHM053.1',
      'STT050',
      'STT050.1',
      'MAT038',
      'CSC011',
      'CRS001'
    ]
  },
  {
    id: 'req-major-core',
    category: 'MajorCore',
    title: 'Environmental Science Professional Core',
    requiredCredits: 65,
    description: 'Fundamentals of environmental science, ecology, surveying, taxonomy, environmental chemistry, geospatial analysis, soil science, pollution, meteorology, climate change, and EIA.',
    coursesList: [
      'ENS011',
      'PHY012',
      'BIO021',
      'ENS022',
      'ENS024',
      'BIO023',
      'BIO031',
      'ENS032',
      'CHM033',
      'ENS037',
      'ENS038',
      'ENS039',
      'ENS041',
      'BIO034',
      'CHM036',
      'ENS105',
      'ENS035',
      'ENS042',
      'ENS043',
      'ENS044',
      'ENS045'
    ]
  },
  {
    id: 'req-major-elec',
    category: 'MajorElective',
    title: 'Environmental Science Major Electives',
    requiredCredits: 6,
    description: 'Specialized environmental science electives in Watershed Management and Solid Waste Management.',
    coursesList: [
      'ENS119',
      'ENS117'
    ]
  },
  {
    id: 'req-practicum-thesis',
    category: 'PracticumThesis',
    title: 'Research Project, Undergraduate Thesis & Field Practicum (360 Hours)',
    requiredCredits: 14,
    description: 'Research methods and project design (ENS198), undergraduate thesis (ENS199), industry inspection and seminar (ENS196), and 360-hour field practicum (ENS197).',
    coursesList: [
      'ENS198',
      'ENS199',
      'ENS196',
      'ENS197'
    ]
  }
];

export const TOTAL_DEGREE_CREDITS = 168; // Grand Total Units in Prospectus
export const TARGET_GRADUATION_CREDITS = 168;
