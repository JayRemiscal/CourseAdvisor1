import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  GitFork, 
  ChevronDown, 
  ChevronUp, 
  BookOpen,
  ShieldCheck,
  Award
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { COURSE_BY_CODE_MAP, COURSE_BY_ID_MAP } from '../../data/coursesData';
import { TARGET_GRADUATION_CREDITS } from '../../data/degreeRequirements';

interface PlanExplanationsDrawerProps {
  onOpenCourse: (courseId: string) => void;
}

export const PlanExplanationsDrawer: React.FC<PlanExplanationsDrawerProps> = ({ onOpenCourse }) => {
  const { 
    activePlan, 
    unscheduledCourses, 
    planAssumptions, 
    activePlanExplanations,
    completedCreditsCount,
    inProgressCreditsCount
  } = useAcademic();

  const [isOpen, setIsOpen] = useState(false);

  // Compute total planned credits across this plan
  const totalPlannedCredits = activePlan.semesters.reduce((acc, sem) => {
    return acc + sem.courseIds.reduce((cAcc, cId) => {
      const c = COURSE_BY_ID_MAP.get(cId);
      return cAcc + (c?.credits || 0);
    }, 0);
  }, 0);

  const totalCourseCount = activePlan.semesters.reduce((acc, sem) => acc + sem.courseIds.length, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-xl bg-blue-50 text-[#2563EB] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-xs sm:text-sm text-[#17365D]">
                Algorithmic Plan Analysis & Curriculum Assumptions
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#17365D] shrink-0">
                Kahn's Sort Verified
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Review topological ordering decisions, critical path prerequisites, and unscheduled courses.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            {isOpen ? 'Collapse Details' : 'View Full Diagnostics'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Content Body */}
      {isOpen && (
        <div className="p-6 pt-2 border-t border-slate-100 space-y-6 text-xs animate-in fade-in duration-150">
          
          {/* Degree Credit Audit Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Total Planned Credits</span>
              <strong className="text-base font-extrabold text-[#17365D]">
                {totalPlannedCredits} / {TARGET_GRADUATION_CREDITS} cr
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Scheduled Courses</span>
              <strong className="text-base font-extrabold text-[#17365D]">
                {totalCourseCount} Courses
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Active Plan Horizon</span>
              <strong className="text-base font-extrabold text-[#17365D]">
                {activePlan.semesters.length} Semesters
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Unscheduled In Horizon</span>
              <strong className={`text-base font-extrabold ${unscheduledCourses.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {unscheduledCourses.length} Courses
              </strong>
            </div>
          </div>

          {/* Unscheduled Courses Notice (if any) */}
          {unscheduledCourses.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider">
                  Unscheduled Degree Requirements ({unscheduledCourses.length} Courses)
                </h4>
              </div>
              <p className="text-xs text-amber-800">
                These courses fit into the 168-unit BSES curriculum, but were not scheduled in the current horizon because of the chosen semester limit or prerequisite chain depth:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {unscheduledCourses.map(({ course, reason }) => (
                  <div
                    key={course.id}
                    className="p-2.5 rounded-lg bg-white border border-amber-200 text-xs shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        onClick={() => onOpenCourse(course.id)}
                        className="font-mono font-bold text-[#17365D] hover:text-[#2563EB] cursor-pointer"
                      >
                        {course.code} · {course.credits} cr
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Year {course.yearLevel || Math.floor(course.level / 100)} · {(course.termsOffered || []).join('/')}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800 line-clamp-1">{course.title}</p>
                    <p className="text-[10px] text-amber-700 italic">{reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transparent Curriculum Assumptions */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-[#17365D] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              Official Curriculum Assumptions & Heuristic Framework
            </h4>
            <p className="text-xs text-slate-600">
              In accordance with academic planning standards, the engine makes the following explicit assumptions without claiming unverified mathematical optimality:
            </p>
            <ul className="space-y-1.5 pt-1">
              {planAssumptions.map((assump, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                  <span>{assump}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Gateway Courses Highlight */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-xs text-[#17365D] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#F4C95D]" />
              Critical Path Milestone Unlocks (MSU-Naawan BSES)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="font-mono font-bold text-blue-700 block">ENS011</span>
                <span className="font-semibold text-slate-800 text-[11px] block">Fund. of Env. Sci.</span>
                <span className="text-[10px] text-slate-500">Unlocks 4 downstream major courses</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="font-mono font-bold text-blue-700 block">ENS022</span>
                <span className="font-semibold text-slate-800 text-[11px] block">Fundamentals of Ecology</span>
                <span className="text-[10px] text-slate-500">Unlocks Env. Chem, Soil Sci, & EIA</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="font-mono font-bold text-blue-700 block">ENS035</span>
                <span className="font-semibold text-slate-800 text-[11px] block">EIA Gateway & Field Camp</span>
                <span className="text-[10px] text-slate-500">Summer requirement before Senior Thesis</span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
