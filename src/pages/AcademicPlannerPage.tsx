import React, { useState } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Trash2, 
  MoveRight, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Layers, 
  RotateCcw,
  ShieldAlert,
  ChevronDown,
  Info,
  Calendar,
  Sliders,
  Award,
  ArrowRight
} from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { COURSE_BY_ID_MAP } from '../data/coursesData';
import { TermType, MoveValidationResult } from '../types/academic';
import { AddCourseModal } from '../components/common/AddCourseModal';
import { TARGET_GRADUATION_CREDITS } from '../data/degreeRequirements';
import { PlanManagementBar } from '../components/planner/PlanManagementBar';
import { PlanGeneratorModal } from '../components/planner/PlanGeneratorModal';
import { SemesterCard } from '../components/planner/SemesterCard';
import { MoveConflictModal } from '../components/planner/MoveConflictModal';
import { PlanExplanationsDrawer } from '../components/planner/PlanExplanationsDrawer';
import { CustomSelect, CustomSelectOption } from '../components/common/CustomSelect';

interface AcademicPlannerPageProps {
  onOpenCourse: (courseId: string) => void;
  onNavigateToWorkload?: () => void;
}

export const AcademicPlannerPage: React.FC<AcademicPlannerPageProps> = ({
  onOpenCourse,
  onNavigateToWorkload,
}) => {
  const { 
    activePlan, 
    moveCourseBetweenSemesters, 
    addSemesterToPlan, 
    removeSemesterFromPlan,
    checkCoursePrerequisites,
    validateCourseMoveAction,
    prerequisiteAlerts,
    profile,
    activePlanExplanations,
    showToast
  } = useAcademic();

  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [showCourseExplanations, setShowCourseExplanations] = useState(true);
  const [activeAddModalSemester, setActiveAddModalSemester] = useState<{ id: string; name: string } | null>(null);
  
  // Mobile / Modal Move state
  const [movingCourse, setMovingCourse] = useState<{ courseId: string; fromSemesterId: string } | null>(null);

  // Prerequisite Conflict Modal state
  const [conflictModalData, setConflictModalData] = useState<{
    isOpen: boolean;
    courseCode: string;
    courseTitle: string;
    fromSemesterName: string;
    toSemesterName: string;
    validation: MoveValidationResult;
  } | null>(null);

  // Add custom term modal
  const [isAddTermModalOpen, setIsAddTermModalOpen] = useState(false);
  const [newTermSeason, setNewTermSeason] = useState<TermType>('Summer');
  const [newTermYear, setNewTermYear] = useState<number>(3);
  const [newAcademicYear, setNewAcademicYear] = useState<string>('2025–2026');

  // Compute total planned credits across active plan
  const totalPlannedCredits = activePlan.semesters.reduce((acc, sem) => {
    return acc + sem.courseIds.reduce((cAcc, cId) => {
      const c = COURSE_BY_ID_MAP.get(cId);
      return cAcc + (c?.credits || 0);
    }, 0);
  }, 0);

  // Handle Drag & Drop move
  const handleDropCourse = (courseId: string, fromSemesterId: string, toSemesterId: string) => {
    if (fromSemesterId === toSemesterId) return;

    const course = COURSE_BY_ID_MAP.get(courseId);
    if (!course) return;

    const fromSem = activePlan.semesters.find(s => s.id === fromSemesterId);
    const toSem = activePlan.semesters.find(s => s.id === toSemesterId);
    if (!fromSem || !toSem) return;

    // Run prerequisite & downstream dependency validation
    const validation = validateCourseMoveAction(courseId, fromSemesterId, toSemesterId);

    if (!validation.isValid) {
      // Show clear conflict modal and reject move
      setConflictModalData({
        isOpen: true,
        courseCode: course.code,
        courseTitle: course.title,
        fromSemesterName: fromSem.name,
        toSemesterName: toSem.name,
        validation,
      });
      return;
    }

    // Move is valid!
    moveCourseBetweenSemesters(fromSemesterId, toSemesterId, courseId);
    showToast(`Successfully moved ${course.code} to ${toSem.name}`, 'success');
  };

  // Handle Move selection from modal (for mobile or click-based users)
  const handleSelectTargetSemester = (targetSemesterId: string) => {
    if (!movingCourse) return;

    const { courseId, fromSemesterId } = movingCourse;
    setMovingCourse(null);

    handleDropCourse(courseId, fromSemesterId, targetSemesterId);
  };

  const handleAddTerm = () => {
    addSemesterToPlan(newTermSeason, newTermYear, newAcademicYear);
    setIsAddTermModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Planner Management Bar (Plan Switcher, Generate, Save, Duplicate, Rename, Export) */}
      <PlanManagementBar
        onOpenGenerator={() => setIsGeneratorModalOpen(true)}
        showExplanations={showCourseExplanations}
        onToggleExplanations={() => setShowCourseExplanations(!showCourseExplanations)}
        onOpenAddTerm={() => setIsAddTermModalOpen(true)}
        onNavigateToWorkload={onNavigateToWorkload}
      />

      {/* Prerequisite Alert Banner if any conflicts exist in active schedule */}
      {prerequisiteAlerts.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-xs animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1 min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5 flex-wrap">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Prerequisite Sequencing Alerts</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                  {prerequisiteAlerts.length} Conflicts
                </span>
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                The following scheduled courses appear in terms prior to or concurrent with their prerequisites:
              </p>
              <ul className="list-disc list-inside text-xs space-y-1 text-amber-900 font-medium pt-1">
                {prerequisiteAlerts.map((alt, idx) => (
                  <li key={idx}>
                    <strong className="font-mono">{alt.courseCode}</strong> in {alt.semesterName} requires{' '}
                    <strong>{alt.missingPrereqs.join(', ')}</strong> in an earlier semester.
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setIsGeneratorModalOpen(true)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-colors shrink-0 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Auto-Resolve with Planner</span>
            </button>
          </div>
        </div>
      )}

      {/* Multi-Semester Grid / Responsive Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {activePlan.semesters.map(semester => (
          <SemesterCard
            key={semester.id}
            semester={semester}
            targetCredits={18}
            showExplanations={showCourseExplanations}
            explanations={activePlanExplanations}
            onOpenCourse={onOpenCourse}
            onOpenAddModal={(semId, semName) => setActiveAddModalSemester({ id: semId, name: semName })}
            onRequestMove={(cId, semId) => setMovingCourse({ courseId: cId, fromSemesterId: semId })}
            onDropCourse={handleDropCourse}
            onDeleteCustomTerm={activePlan.semesters.length > 4 ? (semId) => removeSemesterFromPlan(semId) : undefined}
            onNavigateToWorkload={onNavigateToWorkload}
          />
        ))}
      </div>

      {/* Plan Explanations, Diagnostics & Curriculum Assumptions Drawer */}
      <PlanExplanationsDrawer onOpenCourse={onOpenCourse} />

      {/* Automatic Plan Generator Modal */}
      <PlanGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={() => setIsGeneratorModalOpen(false)}
      />

      {/* Move Conflict Warning Modal (Blocks Invalid Prerequisite & Downstream Moves) */}
      {conflictModalData && (
        <MoveConflictModal
          isOpen={conflictModalData.isOpen}
          onClose={() => setConflictModalData(null)}
          courseCode={conflictModalData.courseCode}
          courseTitle={conflictModalData.courseTitle}
          targetSemesterName={conflictModalData.toSemesterName}
          sourceSemesterName={conflictModalData.fromSemesterName}
          validation={conflictModalData.validation}
        />
      )}

      {/* Add Course Modal */}
      {activeAddModalSemester && (
        <AddCourseModal
          semesterId={activeAddModalSemester.id}
          semesterName={activeAddModalSemester.name}
          onClose={() => setActiveAddModalSemester(null)}
        />
      )}

      {/* Mobile / Click-based Move Target Selector Modal */}
      {movingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-sm text-[#17365D] flex items-center gap-2">
              <MoveRight className="w-4 h-4 text-[#2563EB]" />
              Move Course to Another Term
            </h3>
            <p className="text-xs text-slate-600">
              Select target semester for{' '}
              <strong className="font-mono text-slate-900">
                {COURSE_BY_ID_MAP.get(movingCourse.courseId)?.code}
              </strong>:
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {activePlan.semesters
                .filter(s => s.id !== movingCourse.fromSemesterId)
                .map(sem => (
                  <button
                    key={sem.id}
                    onClick={() => handleSelectTargetSemester(sem.id)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-left text-xs font-semibold hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-between group"
                  >
                    <span className="text-[#17365D] group-hover:text-[#2563EB]">{sem.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {sem.courseIds.length} courses
                    </span>
                  </button>
                ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setMovingCourse(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Custom Semester Modal */}
      {isAddTermModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-base text-[#17365D] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2563EB]" />
              Add Academic Term to Roadmap
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Term / Season
                </label>
                <div className="flex gap-2">
                  {(['Summer', 'Fall', 'Spring'] as TermType[]).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewTermSeason(s)}
                      className={`flex-1 py-1.5 rounded-lg font-bold border transition-colors ${
                        newTermSeason === s
                          ? 'bg-[#17365D] text-white border-[#17365D]'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Academic Year Level
                </label>
                <CustomSelect<number>
                  value={newTermYear}
                  onChange={setNewTermYear}
                  options={[
                    { value: 1, label: 'Year 1 (Freshman)' },
                    { value: 2, label: 'Year 2 (Sophomore)' },
                    { value: 3, label: 'Year 3 (Junior)' },
                    { value: 4, label: 'Year 4 (Senior)' },
                  ]}
                  size="sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Academic Calendar Year (e.g. 2025–2026)
                </label>
                <input
                  type="text"
                  value={newAcademicYear}
                  onChange={e => setNewAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddTermModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTerm}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              >
                Create Term
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
