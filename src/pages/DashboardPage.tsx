import React from 'react';
import { 
  Award, 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  Zap,
  Layers,
  Scale,
  Activity,
  UserCheck,
  Check,
  BarChart2,
  PieChart
} from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { COURSE_BY_ID_MAP, COURSES_DATA } from '../data/coursesData';
import { TARGET_GRADUATION_CREDITS } from '../data/degreeRequirements';
import { NavPageId } from '../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (page: NavPageId) => void;
  onOpenCourse: (courseId: string) => void;
  onOpenProspectus?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenCourse,
  onOpenProspectus,
}) => {
  const { 
    profile, 
    activePlan, 
    cumulativeGpa, 
    majorGpa, 
    completedCreditsCount, 
    inProgressCreditsCount,
    remainingCreditsCount,
    completedCoursesCount,
    remainingCoursesCount,
    totalRequiredCoursesCount,
    degreeAudit, 
    prerequisiteAlerts,
    activities,
    getSemesterWorkload,
    checkCoursePrerequisites,
  } = useAcademic();

  // Current Semester & Next Semester
  const currentSemester = activePlan.semesters.find(s => s.isCurrent) || activePlan.semesters.find(s => !s.isCompleted) || activePlan.semesters[0];
  const currentSemIndex = activePlan.semesters.findIndex(s => s.id === currentSemester?.id);
  const nextSemester = currentSemIndex >= 0 && currentSemIndex + 1 < activePlan.semesters.length 
    ? activePlan.semesters[currentSemIndex + 1] 
    : null;

  const currentWorkload = currentSemester ? getSemesterWorkload(currentSemester.id) : null;

  // Planned credits in future terms
  const totalPlannedCredits = degreeAudit.totalPlannedCredits;
  const unscheduledCredits = Math.max(0, TARGET_GRADUATION_CREDITS - completedCreditsCount - inProgressCreditsCount - totalPlannedCredits);

  // Smart Next Course Recommendations:
  const allScheduledIds = new Set(activePlan.semesters.flatMap(s => s.courseIds));
  const recommendedCourses = COURSES_DATA.filter(course => {
    if (allScheduledIds.has(course.id)) return false;
    const prereqCheck = checkCoursePrerequisites(course.code, null);
    return prereqCheck.satisfied;
  }).slice(0, 3);

  return (
    <div className="space-y-6">
      
      {/* 1. Welcome Hero Banner with Student Identity & Quick Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#17365D] via-[#1E4373] to-[#2563EB] text-white p-5 sm:p-8 shadow-md">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3 flex-wrap text-xs">
            <span className="px-2.5 py-0.5 rounded-full font-semibold bg-[#F4C95D] text-[#17365D] inline-flex items-center gap-1 shadow-xs">
              <Award className="w-3.5 h-3.5" /> Dean's List Standing
            </span>
            <span className="text-blue-200">
              {profile.university}
            </span>
            <span className="text-blue-200">
              ID: <span className="font-mono font-bold tracking-wider text-white">{profile.studentId}</span>
            </span>
            <span className="text-blue-200 hidden sm:inline">
              Active Plan: <span className="text-white font-medium">{activePlan.name}</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
            Welcome back, {profile.name}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-2xl">
            You are pursuing the <strong className="text-white">{profile.major}</strong> with a target graduation in{' '}
            <strong className="text-[#F4C95D]">{profile.targetGradTerm} {profile.targetGradYear}</strong>. You have completed{' '}
            <strong className="text-white">{completedCreditsCount}</strong> of <strong className="text-white">{TARGET_GRADUATION_CREDITS}</strong> degree credits with a{' '}
            <strong className="text-[#F4C95D]">{cumulativeGpa.toFixed(2)} Cumulative GPA</strong>.
          </p>

          {/* Quick Action Buttons - 2x2 grid on mobile, flex on desktop */}
          <div className="mt-5 grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 sm:gap-3">
            <button
              onClick={() => onNavigate('Academic Planner')}
              className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-white text-[#17365D] text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center sm:justify-start gap-2 focus-visible:ring-2 focus-visible:ring-[#F4C95D] focus:outline-none cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>Plan Semester</span>
            </button>
            <button
              onClick={() => onNavigate('Prerequisite Explorer')}
              className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors flex items-center justify-center sm:justify-start gap-2 focus-visible:ring-2 focus-visible:ring-[#F4C95D] focus:outline-none cursor-pointer"
            >
              <Zap className="w-4 h-4 text-[#F4C95D] shrink-0" />
              <span>Prerequisites</span>
            </button>
            <button
              onClick={() => onNavigate('Workload Assessment')}
              className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors flex items-center justify-center sm:justify-start gap-2 focus-visible:ring-2 focus-visible:ring-[#F4C95D] focus:outline-none cursor-pointer"
            >
              <Scale className="w-4 h-4 text-blue-200 shrink-0" />
              <span>My Workload</span>
            </button>
            {onOpenProspectus && (
              <button
                onClick={onOpenProspectus}
                className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#F4C95D] hover:bg-[#e0b547] text-[#17365D] text-xs font-bold transition-colors shadow-sm flex items-center justify-center sm:justify-start gap-2 focus-visible:ring-2 focus-visible:ring-white focus:outline-none cursor-pointer"
                title="View full semester-by-semester university curriculum sheet"
              >
                <GraduationCap className="w-4 h-4 text-[#17365D] shrink-0" />
                <span>Prospectus</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none">
          <GraduationCap className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Prerequisite Warnings Banner (if any conflict detected in plan) */}
      {prerequisiteAlerts.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-200/80 text-amber-900 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div className="min-w-0 space-y-1">
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-2">
                <span>Prerequisite Sequence Warning</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-bold">
                  {prerequisiteAlerts.length} Issues
                </span>
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Planned courses are scheduled before prerequisites are satisfied:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {prerequisiteAlerts.map(a => (
                  <span
                    key={`${a.courseCode}-${a.semesterId}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/90 border border-amber-200 text-[11px] font-medium text-amber-950"
                  >
                    <span className="font-mono font-bold">{a.courseCode}</span>
                    <span className="text-amber-700 text-[10px]">in {a.semesterName}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('Academic Planner')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Resolve in Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Key Academic Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Credits Summary Card */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('My Academic Progress')}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('My Academic Progress'); } }}
          className="cursor-pointer p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-[#2563EB]/50 transition-all group focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-none"
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-500">Degree Credits Status</span>
            <div className="p-2 rounded-lg bg-blue-50 text-[#2563EB] group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-mono tabular-nums font-extrabold text-[#17365D]">
              {completedCreditsCount}
            </span>
            <span className="text-xs font-medium text-slate-400">/ {TARGET_GRADUATION_CREDITS} cr required</span>
          </div>

          <div className="space-y-1 mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>In Progress:</span>
              <strong className="text-[#2563EB] font-mono tabular-nums">{inProgressCreditsCount} credits</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Remaining to Graduate:</span>
              <strong className="text-amber-700 font-mono tabular-nums">{remainingCreditsCount} credits</strong>
            </div>
          </div>
        </div>

        {/* Course Counts Card (Completed vs Remaining) */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('My Academic Progress')}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('My Academic Progress'); } }}
          className="cursor-pointer p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-[#2563EB]/50 transition-all group focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-none"
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-500">Program Course Count</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl font-mono tabular-nums font-extrabold text-[#17365D]">
              {completedCoursesCount}
            </span>
            <span className="text-xs font-medium text-slate-400">/ {totalRequiredCoursesCount} courses</span>
          </div>

          <div className="space-y-1 mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Remaining Courses:</span>
              <strong className="text-slate-800 font-mono tabular-nums">{remainingCoursesCount} courses</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Completion Rate:</span>
              <strong className="text-emerald-700 font-mono tabular-nums">{Math.round((completedCoursesCount / (totalRequiredCoursesCount || 1)) * 100)}%</strong>
            </div>
          </div>
        </div>

        {/* Current Term & Academic Year Card */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('Academic Planner')}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('Academic Planner'); } }}
          className="cursor-pointer p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-[#2563EB]/50 transition-all group focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-none"
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-500">Current Semester</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-1">
            <span className="text-lg sm:text-xl font-extrabold text-[#17365D] block leading-tight">
              {currentSemester?.name || 'Active Term'}
            </span>
            <span className="text-xs font-medium text-slate-500">
              Academic Year {currentSemester?.academicYear || '2025–2026'}
            </span>
          </div>

          <div className="space-y-1 mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Term Load:</span>
              <strong className="text-slate-800 font-mono tabular-nums">{currentWorkload?.totalCredits || 0} Credits</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Enrolled Courses:</span>
              <strong className="text-[#2563EB] font-mono tabular-nums">{currentSemester?.courseIds.length || 0} courses</strong>
            </div>
          </div>
        </div>

        {/* Workload Estimate Card */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => onNavigate('Workload Assessment')}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('Workload Assessment'); } }}
          className="cursor-pointer p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-[#2563EB]/50 transition-all group focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-none"
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-500">Estimated Workload</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-2xl sm:text-3xl font-mono tabular-nums font-extrabold text-[#17365D]">
              {currentWorkload?.totalWeeklyHours || 0}
            </span>
            <span className="text-xs font-medium text-slate-400">hrs/week</span>
          </div>

          <div className="space-y-1 mt-2 pt-2 border-t border-slate-100 text-[11px]">
            <div className="flex justify-between items-center text-slate-600">
              <span>Burnout Risk:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                currentWorkload?.burnoutRisk === 'Extreme'
                  ? 'bg-rose-100 text-rose-800'
                  : currentWorkload?.burnoutRisk === 'Heavy'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {currentWorkload?.burnoutRisk || 'Low'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Weekly Target Cap:</span>
              <strong className="text-slate-700 font-mono tabular-nums">{profile.maxWeeklyHoursLimit} hrs</strong>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Overall Academic Progress Bar & Credit Distribution Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="font-bold text-base text-[#17365D]">
              Overall Academic Degree Completion
            </h3>
            <p className="text-xs text-[#64748B]">
              Progress calculated from completed passing transcripts and active course enrollments.
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-[#2563EB]">
              {degreeAudit.overallPercentComplete}%
            </span>
            <span className="text-xs text-slate-400 block">Degree Satisfied</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex shadow-inner mb-3">
          {/* Completed Credits Bar */}
          <div 
            className="bg-[#2563EB] h-full transition-all duration-500" 
            style={{ width: `${(completedCreditsCount / TARGET_GRADUATION_CREDITS) * 100}%` }}
            title={`Completed: ${completedCreditsCount} credits`}
          />
          {/* In Progress Credits Bar */}
          <div 
            className="bg-[#93C5FD] h-full transition-all duration-500" 
            style={{ width: `${(inProgressCreditsCount / TARGET_GRADUATION_CREDITS) * 100}%` }}
            title={`In Progress: ${inProgressCreditsCount} credits`}
          />
          {/* Planned Credits Bar */}
          <div 
            className="bg-[#F4C95D] h-full transition-all duration-500" 
            style={{ width: `${(totalPlannedCredits / TARGET_GRADUATION_CREDITS) * 100}%` }}
            title={`Planned: ${totalPlannedCredits} credits`}
          />
        </div>

        {/* Simple Visual Chart Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#2563EB] shrink-0" />
            <div>
              <span className="text-slate-500 text-[10px] block font-medium">Completed</span>
              <strong className="text-[#17365D] font-bold">{completedCreditsCount} cr ({degreeAudit.overallPercentComplete}%)</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/30 border border-blue-100 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#93C5FD] shrink-0" />
            <div>
              <span className="text-slate-500 text-[10px] block font-medium">In Progress</span>
              <strong className="text-[#2563EB] font-bold">{inProgressCreditsCount} cr ({Math.round((inProgressCreditsCount / TARGET_GRADUATION_CREDITS) * 100)}%)</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/40 border border-amber-100 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#F4C95D] shrink-0" />
            <div>
              <span className="text-slate-500 text-[10px] block font-medium">Planned in Plan</span>
              <strong className="text-amber-800 font-bold">{totalPlannedCredits} cr ({Math.round((totalPlannedCredits / TARGET_GRADUATION_CREDITS) * 100)}%)</strong>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-200 shrink-0" />
            <div>
              <span className="text-slate-500 text-[10px] block font-medium">Remaining to Plan</span>
              <strong className="text-slate-700 font-bold">{unscheduledCredits} cr ({Math.round((unscheduledCredits / TARGET_GRADUATION_CREDITS) * 100)}%)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Main Two-Column Layout: Upcoming Planned Courses vs Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Upcoming Planned Courses & Workload Summary */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upcoming Planned Courses Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#17365D]">
                    Upcoming Planned Courses
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                    {nextSemester?.name || 'Next Term'}
                  </span>
                </div>
                <p className="text-xs text-[#64748B]">
                  Pre-scheduled courses for registration review in active degree plan
                </p>
              </div>

              <button
                onClick={() => onNavigate('Academic Planner')}
                className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
              >
                <span>Full Planner</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Courses List or Empty State */}
            {!nextSemester || nextSemester.courseIds.length === 0 ? (
              <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No courses planned for next semester yet</p>
                <p className="text-[11px] text-slate-400 mt-1">Open the Academic Planner to schedule your upcoming courses.</p>
                <button
                  onClick={() => onNavigate('Academic Planner')}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8]"
                >
                  Schedule Courses
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nextSemester.courseIds.map(cId => {
                  const course = COURSE_BY_ID_MAP.get(cId);
                  if (!course) return null;
                  const prereqCheck = checkCoursePrerequisites(course.code, nextSemester.id);

                  return (
                    <div
                      key={cId}
                      onClick={() => onOpenCourse(course.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                        prereqCheck.satisfied
                          ? 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs'
                          : 'border-amber-300 bg-amber-50/40 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-[#17365D] bg-slate-100 px-2 py-0.5 rounded">
                          {course.code}
                        </span>
                        <span className="text-xs font-semibold text-[#2563EB]">
                          {course.credits} Credits
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-[#2563EB] transition-colors">
                        {course.title}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                        <span>Workload: {course.weeklyHours.lecture + course.weeklyHours.lab + course.weeklyHours.study}h/wk</span>

                        {prereqCheck.satisfied ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-0.5 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold flex items-center gap-0.5 text-[10px]">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Prereqs Needed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Current Term Estimated Workload Detailed Summary */}
          {currentWorkload && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-[#17365D] flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#2563EB]" />
                    Current Academic Term Workload Analysis
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculated weekly commitment for {currentSemester?.name} ({currentWorkload.totalCredits} credits)
                  </p>
                </div>

                <button
                  onClick={() => onNavigate('Workload Assessment')}
                  className="text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  Deep Workload Model →
                </button>
              </div>

              {/* Carnegie Breakdown Bar Chart */}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] block">Lectures & Seminars</span>
                    <strong className="text-sm font-bold text-[#17365D]">{currentWorkload.lectureHours} hrs/wk</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] block">Labs & Practicums</span>
                    <strong className="text-sm font-bold text-[#17365D]">{currentWorkload.labHours} hrs/wk</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] block">Study & Homework</span>
                    <strong className="text-sm font-bold text-[#2563EB]">{currentWorkload.studyHours} hrs/wk</strong>
                  </div>
                </div>

                {/* Horizontal Segmented Bar */}
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                  <div 
                    className="bg-[#17365D]" 
                    style={{ width: `${(currentWorkload.lectureHours / (currentWorkload.totalWeeklyHours || 1)) * 100}%` }}
                    title={`Lecture: ${currentWorkload.lectureHours}h`}
                  />
                  <div 
                    className="bg-[#2563EB]" 
                    style={{ width: `${(currentWorkload.labHours / (currentWorkload.totalWeeklyHours || 1)) * 100}%` }}
                    title={`Lab: ${currentWorkload.labHours}h`}
                  />
                  <div 
                    className="bg-[#F4C95D]" 
                    style={{ width: `${(currentWorkload.studyHours / (currentWorkload.totalWeeklyHours || 1)) * 100}%` }}
                    title={`Study: ${currentWorkload.studyHours}h`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Carnegie Benchmark: 1 cr = 3 hrs weekly commit</span>
                  <span>Overall Term Difficulty: <strong className="text-slate-800">{currentWorkload.difficultyScore}/5.0</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Unlocked Recommendations */}
          {recommendedCourses.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F4C95D]" />
                  <h4 className="text-xs font-bold text-[#17365D] uppercase tracking-wider">
                    Eligible Next Steps (Prerequisites Unlocked)
                  </h4>
                </div>
                <button
                  onClick={() => onNavigate('Course Catalog')}
                  className="text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  Browse Catalog →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recommendedCourses.map(course => (
                  <div
                    key={course.id}
                    onClick={() => onOpenCourse(course.id)}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-[#17365D]">{course.code}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        Ready
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                      {course.title}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {course.credits} Credits · {course.requirementCategory}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Col: Recent Academic Activity & Category Snapshot */}
        <div className="space-y-6">
          
          {/* Recent Academic Activity Card (Required by prompt) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#2563EB]" />
                <h3 className="font-bold text-sm text-[#17365D]">
                  Recent Academic Activity
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Audit Trail
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent activity recorded.
              </div>
            ) : (
              <div className="space-y-3.5">
                {activities.slice(0, 6).map(act => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-[#2563EB] shrink-0 mt-0.5">
                      {act.type === 'grade_recorded' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : act.type === 'milestone_reached' ? (
                        <Award className="w-3.5 h-3.5 text-[#F4C95D]" />
                      ) : act.type === 'plan_modified' ? (
                        <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                      ) : (
                        <Activity className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <h5 className="font-bold text-slate-800">
                          {act.title}
                        </h5>
                        <span className="text-[10px] text-slate-400">
                          {act.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {act.description}
                      </p>

                      {/* Provenance Badge (distinguish sample data vs student entry) */}
                      <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                        act.source === 'student'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {act.source === 'student' ? '👤 Student Verified' : '🏛 University Record'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Requirement Categories Mini Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-[#17365D]">
                Requirement Breakdown
              </h3>
              <button
                onClick={() => onNavigate('My Academic Progress')}
                className="text-xs font-semibold text-[#2563EB] hover:underline"
              >
                Full Audit →
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {degreeAudit.categories.map(cat => {
                const percent = Math.min(100, Math.round((cat.completedCredits / cat.requiredCredits) * 100));

                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 truncate pr-2">
                        {cat.title}
                      </span>
                      <span className="font-mono text-[11px] text-slate-600 shrink-0">
                        {cat.completedCredits}/{cat.requiredCredits} cr
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          cat.isSatisfied ? 'bg-emerald-500' : 'bg-[#2563EB]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
