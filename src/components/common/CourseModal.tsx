import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Calendar, 
  BarChart2, 
  Plus, 
  Star,
  ExternalLink,
  GitFork
} from 'lucide-react';
import { Course } from '../../types/academic';
import { useAcademic } from '../../context/AcademicContext';
import { COURSE_BY_CODE_MAP } from '../../data/coursesData';
import { CustomSelect } from './CustomSelect';

interface CourseModalProps {
  course: Course | null;
  onClose: () => void;
  targetSemesterId?: string;
  onSelectPrereqCourse?: (course: Course) => void;
  onExplorePrerequisites?: (courseCode: string) => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  course,
  onClose,
  targetSemesterId,
  onSelectPrereqCourse,
  onExplorePrerequisites,
}) => {
  const { 
    activePlan, 
    addCourseToSemester, 
    checkCoursePrerequisites 
  } = useAcademic();

  const [selectedSemId, setSelectedSemId] = useState<string>(
    targetSemesterId || activePlan.semesters[0]?.id || ''
  );
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  if (!course) return null;

  const prereqValidation = checkCoursePrerequisites(course.code, selectedSemId || null);

  const handleAdd = () => {
    if (!selectedSemId) return;
    const ok = addCourseToSemester(selectedSemId, course.id);
    if (ok) {
      const sem = activePlan.semesters.find(s => s.id === selectedSemId);
      setAddedMessage(`Successfully added to ${sem?.name || 'semester'}!`);
      setTimeout(() => setAddedMessage(null), 3000);
    } else {
      setAddedMessage('Course is already scheduled in this semester.');
      setTimeout(() => setAddedMessage(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header with Navy banner */}
        <div className="bg-[#17365D] text-white px-4 sm:px-6 py-4 sm:py-5 flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
              <span className="px-2 sm:px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-white/20 text-white border border-white/20 tracking-wider">
                {course.code}
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#2563EB] text-white">
                {course.credits} Credits
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#F4C95D] text-[#17365D]">
                Level {course.level}
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-md text-xs font-medium bg-white/10 text-blue-100">
                {course.requirementCategory}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
              {course.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Close course details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1 overflow-y-auto text-slate-800">
          
          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
              Course Catalog Description
            </h4>
            <p className="text-sm leading-relaxed text-[#1F2937] bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              {course.description}
            </p>
          </div>

          {/* Academic Workload Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
              <div className="flex items-center gap-1.5 text-xs text-[#2563EB] font-semibold mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Weekly Time</span>
              </div>
              <p className="text-lg font-bold text-[#17365D]">
                {course.weeklyHours.lecture + course.weeklyHours.lab + course.weeklyHours.study} hrs
              </p>
              <p className="text-[10px] text-slate-500">
                {course.weeklyHours.lecture}h lec · {course.weeklyHours.lab}h lab · {course.weeklyHours.study}h study
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
              <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold mb-1">
                <Star className="w-3.5 h-3.5 text-[#D9A834]" />
                <span>Difficulty</span>
              </div>
              <p className="text-lg font-bold text-[#17365D]">
                {course.difficulty.toFixed(1)} / 5.0
              </p>
              <p className="text-[10px] text-slate-500">
                {course.difficulty > 3.8 ? 'Rigorous' : course.difficulty > 2.8 ? 'Moderate' : 'Accessible'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block mb-1">
                Project Intensity
              </span>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                course.projectIntensity === 'High' 
                  ? 'bg-rose-100 text-rose-800' 
                  : course.projectIntensity === 'Medium'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {course.projectIntensity}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Coding / Group work</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block mb-1">
                Exam Rigor
              </span>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                course.examRigor === 'High' 
                  ? 'bg-indigo-100 text-indigo-800' 
                  : course.examRigor === 'Medium'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {course.examRigor}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Midterms / Finals</p>
            </div>
          </div>

          {/* Prerequisites Section */}
          <div>
            <div className="space-y-2 mb-2.5">
              <div className="flex items-center justify-between text-xs">
                <h4 className="font-bold uppercase tracking-wider text-[#64748B]">
                  Prerequisites & Requirements
                </h4>
                <span className="text-slate-500 text-[11px]">
                  Terms: <strong className="text-slate-700">{course.termsOffered.join(', ')}</strong>
                </span>
              </div>
              {onExplorePrerequisites && (
                <button
                  onClick={() => {
                    onClose();
                    onExplorePrerequisites(course.code);
                  }}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <GitFork className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Explore in Prerequisite Graph →</span>
                </button>
              )}
            </div>

            {course.prerequisites.length === 0 ? (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No prerequisites required for this course. Open for immediate enrollment.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {prereqValidation.details.map((detail, idx) => {
                  const prereqCourseObj = COURSE_BY_CODE_MAP.get(detail.prereqCode);

                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors gap-2 ${
                        detail.satisfied
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {detail.satisfied ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="font-mono font-bold text-slate-900 tracking-wider">
                              {detail.prereqCode}
                            </strong>
                            <span className="text-slate-700 truncate">{detail.prereqTitle}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">{detail.message}</span>
                        </div>
                      </div>

                      {prereqCourseObj && onSelectPrereqCourse && (
                        <button
                          onClick={() => onSelectPrereqCourse(prereqCourseObj)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#2563EB] hover:bg-white rounded-lg border border-blue-200 shrink-0 cursor-pointer shadow-2xs"
                        >
                          View Prereq
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Add to Term */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17365D] mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
              Schedule Course into Academic Plan
            </h4>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <CustomSelect
                  value={selectedSemId}
                  onChange={setSelectedSemId}
                  options={activePlan.semesters.map(sem => ({
                    value: sem.id,
                    label: `${sem.name.replace(/\s*\(Current\)/i, '')} (${sem.academicYear})`,
                    badge: sem.isCompleted ? 'Completed' : sem.isCurrent ? 'Current' : undefined,
                    badgeColor: sem.isCompleted ? 'emerald' : sem.isCurrent ? 'blue' : undefined,
                  }))}
                  size="sm"
                  className="rounded-xl border-slate-300"
                />
              </div>

              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Semester</span>
              </button>
            </div>

            {addedMessage && (
              <p className="mt-2 text-xs font-medium text-blue-700 animate-fadeIn">
                {addedMessage}
              </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-md">
            Tags: {course.tags.join(' · ')}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
