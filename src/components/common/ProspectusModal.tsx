import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ExternalLink, 
  BookOpen, 
  Award,
  ChevronDown,
  Layers,
  Search,
  ShieldCheck,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { COURSES_DATA, COURSE_BY_CODE_MAP } from '../../data/coursesData';
import { TOTAL_DEGREE_CREDITS, BS_CS_REQUIREMENTS } from '../../data/degreeRequirements';
import { useAcademic } from '../../context/AcademicContext';
import { Course } from '../../types/academic';

interface ProspectusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCourse: (courseId: string) => void;
}

export const ProspectusModal: React.FC<ProspectusModalProps> = ({
  isOpen,
  onClose,
  onOpenCourse,
}) => {
  const { 
    profile, 
    gradeRecords, 
    activePlan,
    completedCreditsCount,
    inProgressCreditsCount,
    remainingCreditsCount,
    cumulativeGpa,
    checkCoursePrerequisites
  } = useAcademic();

  const [filterQuery, setFilterQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'completed' | 'in-progress' | 'remaining'>('ALL');

  if (!isOpen) return null;

  // Set of completed course codes
  const completedCodesMap = new Map(
    gradeRecords.map(r => [r.courseCode, r])
  );

  // Set of current enrolled course codes
  const currentSemester = activePlan.semesters.find(s => s.isCurrent);
  const enrolledCourseCodes = new Set(
    currentSemester?.courseIds.map(id => COURSES_DATA.find(c => c.id === id)?.code).filter(Boolean) as string[]
  );

  // Semesters definition for the official 4-Year BSES curriculum
  const prospectusSemesters = [
    {
      title: 'FIRST YEAR – FIRST SEMESTER',
      academicYear: 'Year 1 · 1st Semester',
      codes: ['GEC101', 'GEC102', 'GEC120', 'MAT051', 'ENS011', 'Physics 11', 'Physics 11.1', 'PED011', 'NST001'],
      unitsLabel: '23.0 Units'
    },
    {
      title: 'FIRST YEAR – SECOND SEMESTER',
      academicYear: 'Year 1 · 2nd Semester',
      codes: ['GEC103', 'GEC104', 'GEC105', 'GEC110', 'GEC130', 'PHY012', 'PED012', 'NST002'],
      unitsLabel: '20.0 Units'
    },
    {
      title: 'SECOND YEAR – FIRST SEMESTER',
      academicYear: 'Year 2 · 1st Semester',
      codes: ['BIO021', 'GEC106', 'GEC107', 'ENS022', 'ENS024', 'CHM043', 'CHM043.1', 'PED013'],
      unitsLabel: '23.0 Units'
    },
    {
      title: 'SECOND YEAR – SECOND SEMESTER',
      academicYear: 'Year 2 · 2nd Semester',
      codes: ['GEC108', 'GEC109', 'BIO023', 'CHM053', 'CHM053.1', 'FPE101', 'STT050', 'STT050.1', 'PED014'],
      unitsLabel: '24.0 Units'
    },
    {
      title: 'THIRD YEAR – FIRST SEMESTER',
      academicYear: 'Year 3 · 1st Semester',
      codes: ['BIO031', 'ENS032', 'CHM033', 'ENS037', 'ENS038', 'ENS039', 'ENS041'],
      unitsLabel: '22.0 Units'
    },
    {
      title: 'THIRD YEAR – SECOND SEMESTER',
      academicYear: 'Year 3 · 2nd Semester',
      codes: ['BIO034', 'CHM036', 'ENS105', 'ENS119', 'ENS198', 'MAT038', 'CSC011'],
      unitsLabel: '22.0 Units'
    },
    {
      title: 'THIRD YEAR – SUMMER TERM',
      academicYear: 'Year 3 · Summer',
      codes: ['ENS035', 'GEC123'],
      unitsLabel: '6.0 Units'
    },
    {
      title: 'FOURTH YEAR – FIRST SEMESTER',
      academicYear: 'Year 4 · 1st Semester',
      codes: ['ENS042', 'ENS043', 'ENS044', 'ENS045', 'ENS117', 'CRS001', 'ENS199'],
      unitsLabel: '20.0 Units'
    },
    {
      title: 'FOURTH YEAR – SECOND SEMESTER',
      academicYear: 'Year 4 · 2nd Semester',
      codes: ['ENS196', 'ENS197'],
      unitsLabel: '8.0 Units (Field Practicum 360 Hours & Seminar)'
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Top Action Header (hidden in print) */}
        <div className="px-6 py-4 bg-[#17365D] text-white flex items-center justify-between gap-4 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F4C95D] font-black border border-white/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                Official Curriculum Prospectus
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#F4C95D] text-[#17365D]">
                  BOR No. 357, S. 2017
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                {profile.university} · {profile.major}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20"
              title="Print official prospectus"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar (hidden in print) */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Filter courses by code or title (e.g., ENS035, Ecology, Calculus)..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:ring-1 focus:ring-[#2563EB] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-semibold text-[11px]">Filter:</span>
            {[
              { id: 'ALL', label: 'All Courses' },
              { id: 'completed', label: `Completed (${completedCreditsCount} cr)` },
              { id: 'in-progress', label: `In Progress (${inProgressCreditsCount} cr)` },
              { id: 'remaining', label: `Remaining (${remainingCreditsCount} cr)` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id as any)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  filterStatus === tab.id
                    ? 'bg-[#17365D] text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Prospectus Body (Styled as Official University Document) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800 bg-white">
          
          {/* Official University Heading */}
          <div className="text-center pb-4 border-b-2 border-[#17365D] space-y-1">
            <div className="text-[11px] font-bold tracking-widest text-[#17365D] uppercase">
              Republic of the Philippines
            </div>
            <h1 className="text-lg sm:text-xl font-black text-[#17365D] tracking-tight uppercase">
              Mindanao State University at Naawan
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              9023 Naawan, Misamis Oriental, Philippines · School of Marine Fisheries and Technology
            </p>
            <div className="pt-2">
              <h2 className="text-sm sm:text-base font-extrabold text-[#2563EB] tracking-wide uppercase">
                Curriculum Prospectus
              </h2>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Bachelor of Science in Environmental Science (BSES)
              </h3>
            </div>
            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 flex-wrap pt-1">
              <span>BOR Res. No.: <strong>357, S. 2017</strong></span>
              <span>•</span>
              <span>APC Res. No.: <strong>022 Series of 2025</strong></span>
              <span>•</span>
              <span>Effectivity: <strong>SY 2025–2026</strong></span>
              <span>•</span>
              <span>Reference: <strong>CHED CMO No. 35, S. 2005</strong></span>
            </div>
          </div>

          {/* Student Information Strip */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Student Name</span>
              <strong className="text-slate-800 font-bold">{profile.name}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Student ID Number</span>
              <strong className="font-mono text-slate-800">{profile.studentId}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Major / Concentration</span>
              <strong className="text-slate-800">{profile.minor || 'General Track'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cumulative GWA / GPA</span>
              <strong className="text-[#2563EB] font-black">{cumulativeGpa.toFixed(2)} (Dean's Honor Roll)</strong>
            </div>
          </div>

          {/* Semester-by-Semester Tables */}
          <div className="space-y-6">
            {prospectusSemesters.map(semester => {
              // Filter courses
              const courses = semester.codes
                .map(code => COURSE_BY_CODE_MAP.get(code))
                .filter(Boolean) as Course[];

              const visibleCourses = courses.filter(c => {
                if (filterQuery) {
                  const q = filterQuery.toLowerCase();
                  if (!c.code.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q)) {
                    return false;
                  }
                }

                if (filterStatus === 'completed' && !completedCodesMap.has(c.code)) return false;
                if (filterStatus === 'in-progress' && !enrolledCourseCodes.has(c.code)) return false;
                if (filterStatus === 'remaining' && (completedCodesMap.has(c.code) || enrolledCourseCodes.has(c.code))) return false;

                return true;
              });

              if (visibleCourses.length === 0 && (filterQuery || filterStatus !== 'ALL')) {
                return null;
              }

              const semTotalUnits = courses.reduce((sum, c) => sum + c.credits, 0);

              return (
                <div key={semester.title} className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  {/* Semester Table Header */}
                  <div className="bg-[#17365D] text-white px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-bold">
                    <span className="tracking-wide uppercase">{semester.title}</span>
                    <span className="text-blue-200 font-mono text-[11px]">{semester.unitsLabel}</span>
                  </div>

                  {/* Course Rows */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                          <th className="py-2 px-3 w-28">Course No.</th>
                          <th className="py-2 px-3">Descriptive Title</th>
                          <th className="py-2 px-2 text-center w-14">Lec</th>
                          <th className="py-2 px-2 text-center w-14">Lab</th>
                          <th className="py-2 px-2 text-center w-14">Units</th>
                          <th className="py-2 px-3 w-40">Pre-requisite(s)</th>
                          <th className="py-2 px-3 w-36 text-center">Status / Grade</th>
                          <th className="py-2 px-2 text-center w-16 print:hidden">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {visibleCourses.map(course => {
                          const gradeRec = completedCodesMap.get(course.code);
                          const isCompleted = !!gradeRec;
                          const isInProgress = enrolledCourseCodes.has(course.code);
                          const prereqCheck = checkCoursePrerequisites(course.code, null);

                          return (
                            <tr 
                              key={course.code}
                              className={`hover:bg-blue-50/40 transition-colors ${
                                isCompleted ? 'bg-emerald-50/20' : isInProgress ? 'bg-blue-50/20' : ''
                              }`}
                            >
                              <td className="py-2 px-3 font-mono font-bold text-[#17365D]">
                                {course.code}
                              </td>
                              <td className="py-2 px-3 font-medium text-slate-800">
                                <span className="hover:text-[#2563EB] cursor-pointer" onClick={() => onOpenCourse(course.id)}>
                                  {course.title}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center text-slate-600 font-mono">
                                {course.lectureHours ?? course.weeklyHours.lecture}
                              </td>
                              <td className="py-2 px-2 text-center text-slate-600 font-mono">
                                {course.labHours ?? course.weeklyHours.lab}
                              </td>
                              <td className="py-2 px-2 text-center font-bold text-slate-800 font-mono">
                                {course.credits.toFixed(1)}
                              </td>
                              <td className="py-2 px-3 text-slate-600 font-mono text-[10px]">
                                {course.prerequisites.length > 0 ? (
                                  <span className={prereqCheck.satisfied ? 'text-slate-700' : 'text-amber-800 font-semibold'}>
                                    {course.prerequisites.join(', ')}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">None</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {isCompleted ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Passed ({gradeRec?.grade})
                                  </span>
                                ) : isInProgress ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                    <Clock className="w-3 h-3 text-blue-600" />
                                    Enrolled
                                  </span>
                                ) : !prereqCheck.satisfied ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                    Prereq Deficient
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">Not Taken</span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-center print:hidden">
                                <button
                                  onClick={() => onOpenCourse(course.id)}
                                  className="p-1 rounded text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 transition-colors"
                                  title="View Course Details"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-bold text-slate-700 border-t border-slate-200 text-[11px]">
                          <td colSpan={4} className="py-2 px-3 text-right">
                            Total Semester Units:
                          </td>
                          <td className="py-2 px-2 text-center text-[#17365D] font-mono font-black">
                            {semTotalUnits.toFixed(1)}
                          </td>
                          <td colSpan={3} className="py-2 px-3 text-slate-400 font-normal">
                            Cleared: {courses.filter(c => completedCodesMap.has(c.code)).reduce((s, c) => s + c.credits, 0)} Units
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Curriculum Category Summary Table */}
          <div className="rounded-xl border border-slate-200 p-5 bg-slate-50/70 space-y-3">
            <h4 className="text-xs font-bold text-[#17365D] uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              Summary of Curriculum Units (CMO No. 35, Series of 2005)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {BS_CS_REQUIREMENTS.map(req => (
                <div key={req.id} className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">{req.category}</span>
                  <span className="font-bold text-slate-800 block line-clamp-1">{req.title}</span>
                  <span className="font-mono text-sm font-black text-[#17365D] mt-1 block">
                    {req.requiredCredits} Units
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-black text-sm text-[#17365D]">
              <span>GRAND TOTAL UNITS REQUIRED FOR GRADUATION:</span>
              <span className="font-mono text-base text-[#2563EB]">{TOTAL_DEGREE_CREDITS} Units</span>
            </div>
          </div>

          {/* Official Signatures Section for Printing */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
            <div className="space-y-8">
              <div className="border-b border-slate-400 w-3/4 mx-auto pb-1 font-bold text-slate-800">
                DR. LEO M. PACIFICO
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">
                Academic Program Adviser
              </p>
            </div>
            <div className="space-y-8">
              <div className="border-b border-slate-400 w-3/4 mx-auto pb-1 font-bold text-slate-800">
                DR. ELSIE C. DE LA CRUZ
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">
                Department Chairperson / Dean
              </p>
            </div>
            <div className="space-y-8">
              <div className="border-b border-slate-400 w-3/4 mx-auto pb-1 font-bold text-slate-800">
                ATTY. MA. CIELO R. DELGADO
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">
                University Registrar
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer (hidden in print) */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4 shrink-0 print:hidden text-xs">
          <span className="text-slate-500 text-[11px]">
            Active Prospectus: <strong>MSU-Naawan BSES 2025–2026</strong> · 54 Courses · 168 Units
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#17365D] text-white font-bold hover:bg-[#0F2440] transition-colors"
          >
            Close Prospectus
          </button>
        </div>

      </div>
    </div>
  );
};
