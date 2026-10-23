import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  MoveRight, 
  GripVertical, 
  Info, 
  RotateCcw,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap
} from 'lucide-react';
import { Semester, Course, CoursePlacementExplanation } from '../../types/academic';
import { COURSE_BY_ID_MAP } from '../../data/coursesData';
import { useAcademic } from '../../context/AcademicContext';
import { CourseConfidenceModal } from '../workload/CourseConfidenceModal';

interface SemesterCardProps {
  semester: Semester;
  targetCredits: number;
  showExplanations: boolean;
  explanations: Record<string, CoursePlacementExplanation>;
  onOpenCourse: (courseId: string) => void;
  onOpenAddModal: (semesterId: string, semesterName: string) => void;
  onRequestMove: (courseId: string, fromSemesterId: string) => void;
  onDropCourse: (courseId: string, fromSemesterId: string, toSemesterId: string) => void;
  onDeleteCustomTerm?: (semesterId: string) => void;
  onNavigateToWorkload?: () => void;
}

export const SemesterCard: React.FC<SemesterCardProps> = ({
  semester,
  targetCredits,
  showExplanations,
  explanations,
  onOpenCourse,
  onOpenAddModal,
  onRequestMove,
  onDropCourse,
  onDeleteCustomTerm,
  onNavigateToWorkload,
}) => {
  const { 
    removeCourseFromSemester, 
    clearSemester, 
    getSemesterWorkload, 
    getSemesterFuzzyWorkload,
    getCourseConfidence,
    checkCoursePrerequisites,
    profile 
  } = useAcademic();

  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedExplanationCourseId, setExpandedExplanationCourseId] = useState<string | null>(null);
  const [confidenceModalCourse, setConfidenceModalCourse] = useState<Course | null>(null);

  const workload = getSemesterWorkload(semester.id);
  const fuzzyWorkload = getSemesterFuzzyWorkload(semester.id);
  const maxTermLimit = profile.maxCreditsPerTerm || 24;
  const isOverloaded = !semester.isCompleted && workload.totalCredits > maxTermLimit;
  const isUnderloaded = !semester.isCompleted && workload.totalCredits < 12 && workload.totalCredits > 0;
  const isOnTarget = !semester.isCompleted && Math.abs(workload.totalCredits - targetCredits) <= 2 && workload.totalCredits > 0;

  // Compute average course difficulty rating (1 to 10)
  const courses = semester.courseIds
    .map(cId => COURSE_BY_ID_MAP.get(cId))
    .filter((c): c is Course => c !== undefined);

  const avgDifficulty = courses.length > 0
    ? Number((courses.reduce((acc, c) => acc + (c.difficultyRating || (c.difficulty ? c.difficulty * 2 : 5)), 0) / courses.length).toFixed(1))
    : 0;

  // Check semester-wide prerequisite status
  const semesterPrereqAlerts = courses
    .map(c => checkCoursePrerequisites(c.code, semester.id))
    .filter(res => !res.satisfied);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only deactivate if leaving the container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const dataStr = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json');
      if (dataStr) {
        const { courseId, fromSemesterId } = JSON.parse(dataStr);
        if (courseId && fromSemesterId) {
          onDropCourse(courseId, fromSemesterId, semester.id);
        }
      }
    } catch (err) {
      console.warn('Drag drop parse error:', err);
    }
  };

  const handleCourseDragStart = (e: React.DragEvent, courseId: string) => {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ courseId, fromSemesterId: semester.id })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  // Helper for category badge styling
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'MajorCore':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MajorElective':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PracticumThesis':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MathScience':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'GenEd':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Mandated':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Helper for difficulty score color
  const getDifficultyColor = (score: number) => {
    if (score >= 8) return 'text-rose-700 bg-rose-50 border-rose-200';
    if (score >= 6) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white rounded-2xl border flex flex-col justify-between shadow-xs transition-all duration-150 ${
        isDragOver
          ? 'border-[#2563EB] ring-4 ring-blue-100 bg-blue-50/20 scale-[1.01]'
          : semester.isCurrent
          ? 'border-[#2563EB] ring-2 ring-blue-100'
          : 'border-slate-200/90'
      }`}
    >
      <div>
        
        {/* Semester Header */}
        <div className={`p-4 rounded-t-2xl border-b ${
          semester.isCompleted
            ? 'bg-slate-50 border-slate-200'
            : semester.isCurrent
            ? 'bg-blue-50/70 border-blue-200'
            : 'bg-white border-slate-100'
        }`}>
          
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-extrabold text-sm text-[#17365D]">
              {semester.name}
            </span>
            {semester.isCompleted ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Completed
              </span>
            ) : semester.isCurrent ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2563EB] text-white">
                Current Term
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                {semester.academicYear}
              </span>
            )}
          </div>

          {/* Credits & Difficulty Badges */}
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-200/60">
            <div className="flex items-center gap-1.5">
              <span className={`font-mono font-bold ${
                semester.isCompleted
                  ? 'text-slate-800'
                  : isOverloaded
                  ? 'text-rose-600'
                  : isUnderloaded
                  ? 'text-amber-600'
                  : isOnTarget
                  ? 'text-emerald-700'
                  : 'text-[#17365D]'
              }`}>
                {workload.totalCredits} cr
              </span>

              {semester.isCompleted ? (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                  Cleared
                </span>
              ) : isOverloaded ? (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 rounded">
                  Overload
                </span>
              ) : isOnTarget ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                  Target
                </span>
              ) : null}
            </div>

            {/* Average Difficulty */}
            {avgDifficulty > 0 && (
              <div 
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${getDifficultyColor(avgDifficulty)}`}
                title={`Average Course Difficulty: ${avgDifficulty}/10`}
              >
                <span>Diff: {avgDifficulty}/10</span>
              </div>
            )}
          </div>

          {/* Estimated Workload Weekly Hours & Burnout Status (Only for Active / Future Terms) */}
          {!semester.isCompleted ? (
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                ~{workload.totalWeeklyHours}h/wk
              </span>

              <span className={`text-[10px] font-semibold ${
                workload.burnoutRisk === 'Heavy' || workload.burnoutRisk === 'Extreme'
                  ? 'text-amber-700 font-bold'
                  : 'text-slate-600'
              }`}>
                {workload.burnoutRisk} Workload
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1">
              <span>All degree requirements passed</span>
              <span className="font-semibold text-emerald-700">Audit Cleared ✓</span>
            </div>
          )}

          {/* Mamdani Fuzzy Workload Stress Score (Active and Future Terms) */}
          {courses.length > 0 && !semester.isCompleted && (
            <div className="flex items-center justify-between text-[11px] mt-1.5 pt-1.5 border-t border-slate-200/50">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#2563EB]" />
                <span className="text-slate-600 font-semibold">Fuzzy Stress:</span>
              </div>
              <div className="flex items-center gap-1 font-mono font-bold">
                <span className={fuzzyWorkload.colorCode === 'rose' ? 'text-rose-600' : fuzzyWorkload.colorCode === 'amber' ? 'text-amber-600' : 'text-emerald-700'}>
                  {fuzzyWorkload.finalSemesterStressScore}/100
                </span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-sans font-bold border ${
                  fuzzyWorkload.colorCode === 'rose' 
                    ? 'bg-rose-50 border-rose-200 text-rose-800' 
                    : fuzzyWorkload.colorCode === 'amber'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  {fuzzyWorkload.semesterWorkloadCategory}
                </span>
              </div>
            </div>
          )}

          {/* Recommended Credit Load Advisory (12–18 Units) */}
          {courses.length > 0 && !semester.isCompleted && (
            <div className="mt-1 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-medium">Guideline (12–18 cr):</span>
              {fuzzyWorkload.creditLoadStatus === 'Overload' ? (
                <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200" title={fuzzyWorkload.creditLoadGuidelineMessage}>
                  Overload Warning ({fuzzyWorkload.totalCredits} cr)
                </span>
              ) : fuzzyWorkload.creditLoadStatus === 'Underload' ? (
                <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200" title={fuzzyWorkload.creditLoadGuidelineMessage}>
                  Light Schedule ({fuzzyWorkload.totalCredits} cr)
                </span>
              ) : (
                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Recommended ({fuzzyWorkload.totalCredits} cr)
                </span>
              )}
            </div>
          )}

          {/* Prerequisite Sequencing Status Notice */}
          {!semester.isCompleted && (
            <div className="mt-2 pt-1 border-t border-slate-100">
              {semesterPrereqAlerts.length === 0 ? (
                <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Sequencing Validated</span>
                </div>
              ) : (
                <div className="text-[10px] text-amber-800 font-bold flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>{semesterPrereqAlerts.length} Prerequisite Conflict(s)</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Courses List */}
        <div className={`p-3 space-y-2.5 min-h-[170px] ${isDragOver ? 'bg-blue-50/30' : ''}`}>
          
          {courses.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              {isDragOver ? (
                <span className="text-[#2563EB] font-bold">Release to drop course here</span>
              ) : (
                <span>No courses scheduled. Drag courses here or click Add Course.</span>
              )}
            </div>
          ) : (
            courses.map(course => {
              const prereqCheck = checkCoursePrerequisites(course.code, semester.id);
              const explanation = explanations[course.id];
              const isExplanationExpanded = expandedExplanationCourseId === course.id || showExplanations;

              return (
                <div
                  key={course.id}
                  draggable={!semester.isCompleted}
                  onDragStart={e => handleCourseDragStart(e, course.id)}
                  className={`p-2.5 rounded-xl border text-xs transition-all relative group select-none ${
                    !prereqCheck.satisfied && !semester.isCompleted
                      ? 'bg-amber-50/80 border-amber-300'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  
                  {/* Top line: Drag handle, course code, credits & difficulty badge */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      {!semester.isCompleted && (
                        <div 
                          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700"
                          title="Drag to move to another term"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                      )}
                      
                      <button
                        onClick={() => onOpenCourse(course.id)}
                        className="font-mono font-bold text-xs text-[#17365D] hover:text-[#2563EB] transition-colors"
                      >
                        {course.code}
                      </button>

                      {/* Category Badge */}
                      <span className={`truncate max-w-[80px] sm:max-w-[120px] px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${getCategoryBadgeClass(course.requirementCategory)}`} title={course.requirementCategory}>
                        {course.requirementCategory}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {course.credits} cr
                      </span>

                      {/* Difficulty Badge */}
                      {(() => {
                        const diffVal = course.difficultyRating || (course.difficulty ? course.difficulty * 2 : 5);
                        return (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getDifficultyColor(diffVal)}`}>
                            ★ {diffVal}
                          </span>
                        );
                      })()}

                      {/* Remove Button */}
                      {!semester.isCompleted && (
                        <button
                          onClick={() => removeCourseFromSemester(semester.id, course.id)}
                          className="text-slate-300 hover:text-rose-600 transition-colors p-0.5 ml-0.5"
                          title="Remove from term"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Course Title */}
                  <p
                    onClick={() => onOpenCourse(course.id)}
                    className="font-semibold text-slate-800 line-clamp-1 cursor-pointer hover:text-[#2563EB] text-[11px]"
                  >
                    {course.title}
                  </p>

                  {/* Prerequisite Alert if not satisfied */}
                  {!prereqCheck.satisfied && !semester.isCompleted && (
                    <div className="mt-1.5 text-[10px] font-bold text-amber-800 flex items-center gap-1 bg-amber-100/90 px-1.5 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                      <span>Missing: {prereqCheck.missingPrereqs.join(', ')}</span>
                    </div>
                  )}

                  {/* Placement Explanation (Why this term?) */}
                  {explanation && (
                    <div className="mt-1.5">
                      {isExplanationExpanded ? (
                        <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200/60 text-[10px] text-slate-700 space-y-1">
                          <div className="flex items-center justify-between font-bold text-blue-900">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#2563EB]" />
                              Why Scheduled Here:
                            </span>
                            {!showExplanations && (
                              <button
                                onClick={() => setExpandedExplanationCourseId(null)}
                                className="text-slate-400 hover:text-slate-600 p-0.5"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="leading-relaxed">
                            {explanation.reason}
                          </p>
                          {explanation.unlocksCount > 0 && (
                            <div className="text-[9px] text-[#2563EB] font-bold">
                              Unlocks {explanation.unlocksCount} downstream course(s): {explanation.unlockedCourses.slice(0, 3).join(', ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setExpandedExplanationCourseId(course.id)}
                          className="text-[10px] text-[#2563EB] hover:underline font-medium flex items-center gap-0.5"
                        >
                          <Info className="w-2.5 h-2.5" />
                          <span>Why this term?</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action row: Hours, Confidence rating & Move button */}
                  <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-400">
                        {course.weeklyHours.lecture + course.weeklyHours.lab + course.weeklyHours.study}h/wk
                      </span>

                      {/* Confidence Pill Button */}
                      {(() => {
                        const confData = getCourseConfidence(course.code);
                        return (
                          <button
                            type="button"
                            onClick={() => setConfidenceModalCourse(course)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors flex items-center gap-0.5 ${
                              confData.isSample
                                ? 'bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                                : 'bg-blue-50 border-blue-200 text-[#2563EB] hover:bg-blue-100'
                            }`}
                            title="Click to adjust your student confidence rating for this course"
                          >
                            <span>Conf: {confData.value.toFixed(1)}</span>
                            {confData.isSample && <span className="text-[8px] text-amber-600 font-normal">sample</span>}
                          </button>
                        );
                      })()}
                    </div>

                    {!semester.isCompleted && (
                      <button
                        onClick={() => onRequestMove(course.id, semester.id)}
                        className="text-[#2563EB] hover:text-[#1D4ED8] hover:underline flex items-center gap-0.5 font-bold"
                      >
                        <span>Move</span>
                        <MoveRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}

        </div>
      </div>

      {/* Semester Card Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenAddModal(semester.id, semester.name)}
          className="flex-1 py-1.5 px-3 rounded-xl text-xs font-bold bg-[#17365D] hover:bg-[#234876] text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-[#F4C95D]" />
          <span>Add Course</span>
        </button>

        {semester.courseIds.length > 0 && !semester.isCompleted && (
          <button
            onClick={() => {
              if (confirm(`Clear all courses from ${semester.name}?`)) {
                clearSemester(semester.id);
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Clear semester"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {onDeleteCustomTerm && !semester.isCompleted && (
          <button
            onClick={() => onDeleteCustomTerm(semester.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete custom term"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Course Confidence Rating Modal */}
      {confidenceModalCourse && (
        <CourseConfidenceModal
          course={confidenceModalCourse}
          isOpen={!!confidenceModalCourse}
          onClose={() => setConfidenceModalCourse(null)}
        />
      )}

    </div>
  );
};
