import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertCircle, 
  Award, 
  Search, 
  Filter, 
  Edit3, 
  Check, 
  X, 
  Layers, 
  RotateCcw,
  BookOpen,
  UserCheck,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Info,
  Printer,
  ShieldCheck,
  ExternalLink,
  Table,
  AlertTriangle,
  GitFork
} from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { LetterGrade, TermType, Course } from '../types/academic';
import { CustomSelect } from '../components/common/CustomSelect';
import { TARGET_GRADUATION_CREDITS, TOTAL_DEGREE_CREDITS, BS_CS_REQUIREMENTS } from '../data/degreeRequirements';
import { CourseAuditItem } from '../utils/academicCalculations';
import { COURSE_BY_CODE_MAP, COURSES_DATA } from '../data/coursesData';

interface AcademicProgressPageProps {
  onOpenCourse: (courseId: string) => void;
  onOpenProspectus?: () => void;
  onExplorePrerequisites?: (courseCode: string) => void;
}

export const AcademicProgressPage: React.FC<AcademicProgressPageProps> = ({
  onOpenCourse,
  onOpenProspectus,
  onExplorePrerequisites,
}) => {
  const { 
    profile,
    degreeAudit, 
    cumulativeGpa, 
    majorGpa, 
    completedCreditsCount,
    inProgressCreditsCount,
    remainingCreditsCount,
    completedCoursesCount,
    remainingCoursesCount,
    totalRequiredCoursesCount,
    setCourseStatus,
    showToast,
    checkCoursePrerequisites,
    activePlan
  } = useAcademic();

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>('ALL'); // ALL, 1, 2, 3, 4
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL'); // ALL, Fall, Spring, Summer
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL'); // ALL, completed, in-progress, not-taken
  const [groupByView, setGroupByView] = useState<'prospectus' | 'year' | 'category' | 'list'>('prospectus');

  // Course status edit modal state
  const [editingCourse, setEditingCourse] = useState<CourseAuditItem | null>(null);
  const [editStatus, setEditStatus] = useState<'completed' | 'in-progress' | 'not-taken'>('completed');
  const [editGrade, setEditGrade] = useState<LetterGrade>('1.25');
  const [editCredits, setEditCredits] = useState<number>(3);
  const [editTerm, setEditTerm] = useState<string>('Current Term');

  // Confirmation banner state
  const [confirmationBanner, setConfirmationBanner] = useState<string | null>(null);

  const availableGrades: LetterGrade[] = [
    '1.0', '1.25', '1.5', '1.75', '2.0', '2.25', '2.5', '2.75', '3.0', '5.0', 'INC',
    'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'
  ];

  const handleOpenEditModal = (course: CourseAuditItem | { code: string; title: string; credits: number; status?: string; grade?: LetterGrade }) => {
    const auditItem: CourseAuditItem = degreeAudit.allProgramCourses.find(c => c.code === course.code) || {
      code: course.code,
      title: course.title,
      credits: course.credits,
      department: 'ENS',
      level: 100,
      yearLevel: 1,
      termsOffered: ['Fall', 'Spring'] as TermType[],
      prerequisites: [],
      status: (course.status as any) || 'not-taken',
      grade: course.grade,
      source: 'sample' as const,
    };

    setEditingCourse(auditItem);
    setEditStatus(
      auditItem.status === 'completed'
        ? 'completed'
        : auditItem.status === 'in-progress'
        ? 'in-progress'
        : 'completed'
    );
    setEditGrade(auditItem.grade || '1.25');
    setEditCredits(auditItem.credits);
    setEditTerm('Current Academic Term');
  };

  const handleSaveCourseStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    setCourseStatus(editingCourse.code, editStatus, {
      grade: editGrade,
      credits: Number(editCredits),
      term: editTerm,
    });

    const msg = `Successfully updated ${editingCourse.code} to ${
      editStatus === 'completed'
        ? `Completed (Grade: ${editGrade}, ${editCredits} units)`
        : editStatus === 'in-progress'
        ? 'In Progress'
        : 'Not Started'
    }!`;

    setConfirmationBanner(msg);
    setTimeout(() => setConfirmationBanner(null), 4000);
    setEditingCourse(null);
  };

  // Filtered courses from degree audit
  const filteredCourses = useMemo(() => {
    return degreeAudit.allProgramCourses.filter(course => {
      // Search
      const q = search.toLowerCase();
      const matchSearch =
        course.code.toLowerCase().includes(q) ||
        course.title.toLowerCase().includes(q) ||
        course.department.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Year level filter
      if (selectedYearLevel !== 'ALL' && course.yearLevel !== parseInt(selectedYearLevel, 10)) {
        return false;
      }

      // Semester filter
      if (selectedSemester !== 'ALL' && !course.termsOffered.includes(selectedSemester as TermType)) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'completed' && course.status !== 'completed') return false;
        if (selectedStatus === 'in-progress' && course.status !== 'in-progress') return false;
        if (selectedStatus === 'not-taken' && (course.status === 'completed' || course.status === 'in-progress')) {
          return false;
        }
      }

      return true;
    });
  }, [degreeAudit.allProgramCourses, search, selectedYearLevel, selectedSemester, selectedStatus]);

  const resetFilters = () => {
    setSearch('');
    setSelectedYearLevel('ALL');
    setSelectedSemester('ALL');
    setSelectedStatus('ALL');
  };

  // Prospectus semester breakdown
  const prospectusSemesters = [
    {
      title: 'First Year · First Semester',
      academicYear: 'Year 1 · 1st Semester',
      codes: ['GEC101', 'GEC102', 'GEC120', 'MAT051', 'ENS011', 'Physics 11', 'Physics 11.1', 'PED011', 'NST001'],
      unitsLabel: '23.0 Units'
    },
    {
      title: 'First Year · Second Semester',
      academicYear: 'Year 1 · 2nd Semester',
      codes: ['GEC103', 'GEC104', 'GEC105', 'GEC110', 'GEC130', 'PHY012', 'PED012', 'NST002'],
      unitsLabel: '20.0 Units'
    },
    {
      title: 'Second Year · First Semester (Current)',
      academicYear: 'Year 2 · 1st Semester',
      codes: ['BIO021', 'GEC106', 'GEC107', 'ENS022', 'ENS024', 'CHM043', 'CHM043.1', 'PED013'],
      unitsLabel: '23.0 Units'
    },
    {
      title: 'Second Year · Second Semester',
      academicYear: 'Year 2 · 2nd Semester',
      codes: ['GEC108', 'GEC109', 'BIO023', 'CHM053', 'CHM053.1', 'FPE101', 'STT050', 'STT050.1', 'PED014'],
      unitsLabel: '24.0 Units'
    },
    {
      title: 'Third Year · First Semester',
      academicYear: 'Year 3 · 1st Semester',
      codes: ['BIO031', 'ENS032', 'CHM033', 'ENS037', 'ENS038', 'ENS039', 'ENS041'],
      unitsLabel: '22.0 Units'
    },
    {
      title: 'Third Year · Second Semester',
      academicYear: 'Year 3 · 2nd Semester',
      codes: ['BIO034', 'CHM036', 'ENS105', 'ENS119', 'ENS198', 'MAT038', 'CSC011'],
      unitsLabel: '22.0 Units'
    },
    {
      title: 'Third Year · Summer Term (Critical Gateway)',
      academicYear: 'Year 3 · Summer',
      codes: ['ENS035', 'GEC123'],
      unitsLabel: '6.0 Units'
    },
    {
      title: 'Fourth Year · First Semester',
      academicYear: 'Year 4 · 1st Semester',
      codes: ['ENS042', 'ENS043', 'ENS044', 'ENS045', 'ENS117', 'CRS001', 'ENS199'],
      unitsLabel: '20.0 Units'
    },
    {
      title: 'Fourth Year · Second Semester (Field Practicum 360 Hours)',
      academicYear: 'Year 4 · 2nd Semester',
      codes: ['ENS196', 'ENS197'],
      unitsLabel: '8.0 Units'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Degree Program & Student Header Card */}
      {/* 1. Degree Program & Student Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#17365D] text-white">
                Official University Prospectus
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#F4C95D] text-[#17365D]">
                BOR Res. No. 357, S. 2017
              </span>
              <span className="text-xs text-slate-500">
                Catalog: <strong className="text-slate-800 font-semibold">{profile.catalogYear}</strong>
              </span>
              <span className="text-xs text-slate-500">
                Student ID: <span className="font-mono font-bold text-slate-800 tracking-wider">{profile.studentId}</span>
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#17365D] tracking-tight">
              {profile.major}
            </h1>
            <p className="text-xs text-[#64748B] mt-1 max-w-2xl leading-relaxed">
              {profile.university} · School of Marine Fisheries and Technology · Division of Environmental Science · Minor: <strong>{profile.minor}</strong> · Target Graduation: <strong>{profile.targetGradTerm} {profile.targetGradYear}</strong>
            </p>

            {/* Quick Action to open modal prospectus */}
            {onOpenProspectus && (
              <div className="mt-3">
                <button
                  onClick={onOpenProspectus}
                  className="w-full sm:w-auto justify-center sm:justify-start px-3.5 py-2 sm:py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] hover:bg-blue-100 text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span>View Official Prospectus Document (Print/PDF)</span>
                </button>
              </div>
            )}
          </div>

          {/* Key Metric Counters - Balanced 2x2 grid on mobile, 4-col on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
            <div className="px-3 sm:px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-100 text-center">
              <span className="text-[10px] font-semibold text-[#2563EB] uppercase tracking-wider block">Completed</span>
              <span className="text-xl font-black text-[#17365D] font-mono tabular-nums">{completedCreditsCount}</span>
              <span className="text-[10px] text-slate-400 block">units</span>
            </div>

            <div className="px-3 sm:px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">In Progress</span>
              <span className="text-xl font-black text-[#2563EB] font-mono tabular-nums">{inProgressCreditsCount}</span>
              <span className="text-[10px] text-slate-400 block">units</span>
            </div>

            <div className="px-3 sm:px-3.5 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-center">
              <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider block">Remaining</span>
              <span className="text-xl font-black text-amber-900 font-mono tabular-nums">{remainingCreditsCount}</span>
              <span className="text-[10px] text-amber-700 block">units</span>
            </div>

            <div className="px-3 sm:px-3.5 py-2.5 rounded-xl bg-[#17365D] text-white text-center shadow-xs">
              <span className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider block">Cumulative GPA</span>
              <span className="text-xl font-black text-[#F4C95D] flex items-center justify-center gap-1 font-mono tabular-nums">
                <Award className="w-4 h-4 shrink-0" />
                {cumulativeGpa.toFixed(2)}
              </span>
              <span className="text-[10px] text-blue-200 block">Major: <span className="font-mono">{majorGpa.toFixed(2)}</span></span>
            </div>
          </div>
        </div>

        {/* Overall Completion Checklist Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700">
              Total Degree Progress ({completedCreditsCount} of {TARGET_GRADUATION_CREDITS} units completed)
            </span>
            <span className="font-bold text-[#2563EB]">
              {degreeAudit.overallPercentComplete}% Degree Complete
            </span>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
            <div 
              className="bg-[#2563EB] h-full transition-all duration-500" 
              style={{ width: `${(completedCreditsCount / TARGET_GRADUATION_CREDITS) * 100}%` }}
              title={`Completed: ${completedCreditsCount} units`}
            />
            <div 
              className="bg-[#93C5FD] h-full transition-all duration-500" 
              style={{ width: `${(inProgressCreditsCount / TARGET_GRADUATION_CREDITS) * 100}%` }}
              title={`In Progress: ${inProgressCreditsCount} units`}
            />
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              Completed: <strong>{completedCreditsCount} units</strong> ({completedCoursesCount} subjects)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#93C5FD]" />
              In Progress: <strong>{inProgressCreditsCount} units</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              Remaining to Graduate: <strong>{remainingCreditsCount} units</strong> ({remainingCoursesCount} subjects)
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation Banner for Updates */}
      {confirmationBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{confirmationBanner}</span>
          </div>
          <button 
            onClick={() => setConfirmationBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Academic Progress View Mode Selector */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#17365D] uppercase tracking-wider mr-1">
              Curriculum View:
            </span>
            {[
              { id: 'prospectus', label: 'Official Prospectus Sheet (University Format)', icon: Table },
              { id: 'year', label: 'By Year Level', icon: GraduationCap },
              { id: 'category', label: 'By Requirement Area', icon: Layers },
              { id: 'list', label: 'Filtered Course List', icon: BookOpen },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = groupByView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setGroupByView(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#17365D] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {groupByView !== 'prospectus' && (
            <span className="text-[11px] text-slate-400">
              Interactive academic audit modes
            </span>
          )}
        </div>
      </div>

      {/* 3. Render According to Selected View Mode */}

      {/* VIEW MODE A: OFFICIAL PROSPECTUS SHEET (Collegiate Semester Matrix) */}
      {groupByView === 'prospectus' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-[#17365D]">
                    Official Curriculum Prospectus Matrix
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#2563EB]">
                    168 Units Total
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Mindanao State University at Naawan · Prescribed 4-Year BSES Sequence with Prerequisites & Laboratory Hours
                </p>
              </div>

              <div className="flex items-center gap-2">
                {onOpenProspectus && (
                  <button
                    onClick={onOpenProspectus}
                    className="w-full sm:w-auto justify-center px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Official Sheet</span>
                  </button>
                )}
              </div>
            </div>

            {/* Semester-by-Semester Tables */}
            <div className="space-y-6 pt-2">
              {prospectusSemesters.map(semester => {
                const semesterCourses = semester.codes
                  .map(code => degreeAudit.allProgramCourses.find(c => c.code === code))
                  .filter(Boolean) as CourseAuditItem[];

                const semTotalUnits = semesterCourses.reduce((sum, c) => sum + c.credits, 0);
                const semCompletedUnits = semesterCourses
                  .filter(c => c.status === 'completed')
                  .reduce((sum, c) => sum + c.credits, 0);

                return (
                  <div key={semester.title} className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    {/* Header */}
                    <div className="bg-[#17365D] text-white px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 text-xs font-bold">
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <span className="uppercase tracking-wider font-extrabold text-white">{semester.title}</span>
                        <span className="sm:hidden text-[10px] text-blue-200/80 font-normal">Swipe →</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-blue-200 font-mono text-[11px] flex-wrap">
                        <span>Total: <strong className="text-white">{semTotalUnits.toFixed(1)} Units</strong></span>
                        <span>•</span>
                        <span className="text-[#F4C95D]">Cleared: {semCompletedUnits.toFixed(1)} Units</span>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                            <th className="py-2.5 px-3 w-28">Subject Code</th>
                            <th className="py-2.5 px-3">Descriptive Title</th>
                            <th className="py-2.5 px-2 text-center w-14">Lec</th>
                            <th className="py-2.5 px-2 text-center w-14">Lab</th>
                            <th className="py-2.5 px-2 text-center w-14">Units</th>
                            <th className="py-2.5 px-3 w-36">Pre-requisite(s)</th>
                            <th className="py-2.5 px-3 w-36 text-center">Status / Grade</th>
                            <th className="py-2.5 px-3 text-center w-28">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          {semesterCourses.map(course => {
                            const fullCourse = COURSE_BY_CODE_MAP.get(course.code);
                            const prereqCheck = checkCoursePrerequisites(course.code, null);

                            return (
                              <tr 
                                key={course.code}
                                className={`hover:bg-blue-50/40 transition-colors ${
                                  course.status === 'completed'
                                    ? 'bg-emerald-50/20'
                                    : course.status === 'in-progress'
                                    ? 'bg-blue-50/20'
                                    : ''
                                }`}
                              >
                                <td className="py-2.5 px-3 font-mono font-bold text-[#17365D]">
                                  {course.code}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-800">
                                  <button
                                    onClick={() => onOpenCourse(fullCourse?.id || course.code)}
                                    className="hover:text-[#2563EB] text-left transition-colors font-semibold"
                                  >
                                    {course.title}
                                  </button>
                                </td>
                                <td className="py-2.5 px-2 text-center text-slate-600 font-mono">
                                  {fullCourse?.lectureHours ?? fullCourse?.weeklyHours.lecture ?? 3}
                                </td>
                                <td className="py-2.5 px-2 text-center text-slate-600 font-mono">
                                  {fullCourse?.labHours ?? fullCourse?.weeklyHours.lab ?? 0}
                                </td>
                                <td className="py-2.5 px-2 text-center font-bold text-slate-800 font-mono">
                                  {course.credits.toFixed(1)}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[10px]">
                                  {course.prerequisites && course.prerequisites.length > 0 ? (
                                    <span className={prereqCheck.satisfied ? 'text-slate-600' : 'text-amber-800 font-bold'}>
                                      {course.prerequisites.join(', ')}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">None</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {course.status === 'completed' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Passed ({course.grade})
                                    </span>
                                  ) : course.status === 'in-progress' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                      <Clock className="w-3 h-3 text-blue-600" />
                                      In Progress
                                    </span>
                                  ) : !prereqCheck.satisfied ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                      <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                      Prereq Needed
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">Not Taken</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="inline-flex items-center gap-1">
                                    {onExplorePrerequisites && (
                                      <button
                                        onClick={() => onExplorePrerequisites(course.code)}
                                        className="px-2 py-1 rounded-md text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
                                        title="Explore Prerequisite Tree"
                                      >
                                        <GitFork className="w-2.5 h-2.5 text-indigo-600" />
                                        <span>Prereqs</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleOpenEditModal(course)}
                                      className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-[#17365D] hover:text-white text-[#17365D] transition-colors inline-flex items-center gap-1"
                                      title="Update Status / Grade"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>Update</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 font-bold text-slate-700 border-t border-slate-200 text-[11px]">
                            <td colSpan={4} className="py-2 px-3 text-right">
                              Semester Total:
                            </td>
                            <td className="py-2 px-2 text-center text-[#17365D] font-mono font-black">
                              {semTotalUnits.toFixed(1)}
                            </td>
                            <td colSpan={3} className="py-2 px-3 text-slate-500 font-normal">
                              Status: {semCompletedUnits === semTotalUnits ? 'Completed 100%' : `${semCompletedUnits} of ${semTotalUnits} Units Satisfied`}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE B: BY YEAR LEVEL */}
      {groupByView === 'year' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-[#17365D]">
                Academic Progress by Year Level
              </h3>
              <p className="text-xs text-[#64748B]">
                Progression across 4 academic tiers (Freshman to Senior)
              </p>
            </div>
          </div>

          {/* Year Level Grid Cards with Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {degreeAudit.yearLevels.map(yl => {
              const isSelected = selectedYearLevel === yl.level.toString();

              return (
                <div
                  key={yl.level}
                  onClick={() => setSelectedYearLevel(isSelected ? 'ALL' : yl.level.toString())}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#2563EB] bg-blue-50/70 shadow-2xs ring-2 ring-blue-100'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#17365D]">
                      {yl.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      yl.percent === 100
                        ? 'bg-emerald-100 text-emerald-800'
                        : yl.percent > 0
                        ? 'bg-blue-100 text-[#2563EB]'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {yl.percent}%
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-slate-700 mb-2 truncate">
                    {yl.title}
                  </p>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        yl.percent === 100 ? 'bg-emerald-500' : 'bg-[#2563EB]'
                      }`}
                      style={{ width: `${yl.percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Completed: <strong>{yl.completedCredits} cr</strong></span>
                    <span>Total: <strong>{yl.totalCredits} cr</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE C: BY REQUIREMENT AREA */}
      {groupByView === 'category' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="font-bold text-base text-[#17365D]">
              Degree Requirement Categories (CHED CMO No. 35, S. 2005)
            </h3>
            <p className="text-xs text-[#64748B]">
              Progress tracked across the 6 core requirement pillars of the BS Environmental Science program
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {degreeAudit.categories.map(cat => {
              const percent = Math.min(100, Math.round((cat.completedCredits / cat.requiredCredits) * 100));

              return (
                <div key={cat.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {cat.category}
                      </span>
                      <h4 className="font-bold text-xs text-slate-800 line-clamp-1">
                        {cat.title}
                      </h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      cat.isSatisfied
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-[#2563EB]'
                    }`}>
                      {percent}%
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {BS_CS_REQUIREMENTS.find(r => r.category === cat.category)?.description || ''}
                  </p>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cat.isSatisfied ? 'bg-emerald-500' : 'bg-[#2563EB]'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                    <span>{cat.completedCredits} of {cat.requiredCredits} units</span>
                    <span className="font-bold text-[#17365D]">
                      {cat.courses.length} subjects
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTER AND SEARCH BAR (Available in List & Filtered Modes) */}
      {(groupByView === 'list' || groupByView === 'year' || groupByView === 'category') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search required courses by code, title, or department (e.g. ENS035, Ecology, Calculus)..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {(search || selectedYearLevel !== 'ALL' || selectedSemester !== 'ALL' || selectedStatus !== 'ALL') && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t border-slate-100">
            {/* Year level filter */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Year Level:
              </span>
              {[
                { id: 'ALL', label: 'All Years' },
                { id: '1', label: 'Year 1' },
                { id: '2', label: 'Year 2' },
                { id: '3', label: 'Year 3' },
                { id: '4', label: 'Year 4' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedYearLevel(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    selectedYearLevel === tab.id
                      ? 'bg-[#17365D] text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-slate-200 hidden md:block" />

            {/* Status filter */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Status:
              </span>
              {[
                { id: 'ALL', label: 'All Statuses' },
                { id: 'completed', label: 'Completed' },
                { id: 'in-progress', label: 'In Progress' },
                { id: 'not-taken', label: 'Not Started' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    selectedStatus === tab.id
                      ? 'bg-[#2563EB] text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FILTERED COURSE LIST (Shown in list mode or when searching/filtering) */}
      {(groupByView === 'list' || groupByView === 'year' || groupByView === 'category') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong>{filteredCourses.length}</strong> of {degreeAudit.allProgramCourses.length} courses
            </span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                🏛 Sample Transcript
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                👤 Student Verified
              </span>
            </span>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No courses match your active filter criteria</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                We couldn't find any courses matching your combination of year level, semester, and status.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs divide-y divide-slate-100">
              {filteredCourses.map(course => {
                const fullCourse = COURSE_BY_CODE_MAP.get(course.code);

                return (
                  <div
                    key={course.code}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Course Info */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-20 font-mono font-bold text-xs px-2.5 py-1.5 rounded-lg bg-[#17365D] text-white text-center shrink-0 shadow-2xs">
                        {course.code}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 
                            onClick={() => onOpenCourse(fullCourse?.id || course.code)}
                            className="font-bold text-sm text-slate-900 group-hover:text-[#2563EB] cursor-pointer transition-colors"
                          >
                            {course.title}
                          </h4>

                          {course.status === 'completed' && (
                            <span className={`text-[10px] px-2 py-0.5 rounded font-medium border flex items-center gap-1 ${
                              course.source === 'student'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {course.source === 'student' ? '👤 Student Entry' : '🏛 University Record'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span><strong>{course.credits} Units</strong></span>
                          <span>·</span>
                          <span>Year {course.yearLevel}</span>
                          {fullCourse?.lectureHours !== undefined && (
                            <>
                              <span>·</span>
                              <span>Lec: {fullCourse.lectureHours}h / Lab: {fullCourse.labHours}h</span>
                            </>
                          )}
                          {course.prerequisites && course.prerequisites.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-slate-600">Prereqs: {course.prerequisites.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & Action Controls */}
                    <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                      {course.status === 'completed' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Completed
                          </span>
                          {course.grade && (
                            <span className="px-2 py-0.5 rounded text-xs font-black bg-blue-50 text-[#17365D] border border-blue-200">
                              {course.grade}
                            </span>
                          )}
                        </div>
                      ) : course.status === 'in-progress' ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                          In Progress
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                          Not Started
                        </span>
                      )}

                      {onExplorePrerequisites && (
                        <button
                          onClick={() => onExplorePrerequisites(course.code)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center gap-1"
                          title="Explore Prerequisite Graph & Backward Chaining"
                        >
                          <GitFork className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Prereqs</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEditModal(course)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-[#17365D] hover:bg-slate-100 hover:border-blue-300 transition-colors flex items-center gap-1.5 shadow-2xs"
                        title="Change status, enter units, or record grades"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Update Status</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Update Course Status & Completed Credits Modal Dialog */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-[#17365D] text-white">
                  {editingCourse.code}
                </span>
                <h3 className="font-bold text-sm text-slate-900">
                  Update Academic Record
                </h3>
              </div>
              <button 
                onClick={() => setEditingCourse(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Modifying status for: <strong className="text-slate-900">{editingCourse.title}</strong>
            </p>

            <form onSubmit={handleSaveCourseStatus} className="space-y-4 pt-1">
              {/* Status Radio Buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Completion Status:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'completed', label: 'Completed' },
                    { id: 'in-progress', label: 'In Progress' },
                    { id: 'not-taken', label: 'Not Started' },
                  ].map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setEditStatus(option.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        editStatus === option.id
                          ? 'border-[#2563EB] bg-blue-50 text-[#17365D] ring-2 ring-blue-100'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional fields if Completed */}
              {editStatus === 'completed' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-fadeIn">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Grade Earned:
                    </label>
                    <CustomSelect<LetterGrade>
                      value={editGrade}
                      onChange={setEditGrade}
                      options={availableGrades.map(g => ({
                        value: g,
                        label: g,
                      }))}
                      size="sm"
                      className="rounded-lg border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Units Credited:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="12"
                      value={editCredits}
                      onChange={e => setEditCredits(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-800"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Term Completed:
                    </label>
                    <input
                      type="text"
                      value={editTerm}
                      onChange={e => setEditTerm(e.target.value)}
                      placeholder="e.g. 1st Sem 2025–2026"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-800"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  Save Record
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
