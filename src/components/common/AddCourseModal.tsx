import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Check, 
  AlertTriangle, 
  BookOpen, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { Course } from '../../types/academic';
import { COURSES_DATA } from '../../data/coursesData';
import { useAcademic } from '../../context/AcademicContext';

interface AddCourseModalProps {
  semesterId: string;
  semesterName: string;
  onClose: () => void;
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({
  semesterId,
  semesterName,
  onClose,
}) => {
  const { 
    activePlan, 
    addCourseToSemester, 
    checkCoursePrerequisites 
  } = useAcademic();

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  const currentSemester = activePlan.semesters.find(s => s.id === semesterId);
  const alreadyInSemesterIds = useMemo(() => {
    return new Set(currentSemester?.courseIds || []);
  }, [currentSemester]);

  const filteredCourses = useMemo(() => {
    return COURSES_DATA.filter(c => {
      const matchSearch =
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

      const matchDept = selectedDept === 'ALL' || c.department === selectedDept;

      return matchSearch && matchDept;
    });
  }, [search, selectedDept]);

  const departments = ['ALL', 'CS', 'MATH', 'PHYS', 'ENGL', 'STAT', 'PHIL', 'COMM'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-[#17365D] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#F4C95D]" />
              Add Course to {semesterName}
            </h3>
            <p className="text-xs text-blue-200">
              Select courses to enroll in this term. Prerequisites are validated in real-time.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by course code, title, or topic (e.g. CS 310, Algorithms, Python)..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Dept:
            </span>
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-2.5 py-1 rounded-lg font-medium text-xs transition-colors shrink-0 ${
                  selectedDept === dept
                    ? 'bg-[#17365D] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Course listing */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No courses found matching your criteria.
            </div>
          ) : (
            filteredCourses.map(course => {
              const isAlreadyAdded = alreadyInSemesterIds.has(course.id);
              const prereqValidation = checkCoursePrerequisites(course.code, semesterId);

              return (
                <div
                  key={course.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isAlreadyAdded
                      ? 'bg-slate-50/80 border-slate-200 opacity-75'
                      : prereqValidation.satisfied
                      ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                      : 'bg-amber-50/30 border-amber-200 hover:border-amber-300'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {course.code}
                      </span>
                      <span className="text-xs font-semibold text-[#17365D]">
                        {course.title}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        ({course.credits} Credits)
                      </span>
                    </div>

                    <p className="text-xs text-[#64748B] line-clamp-1">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] pt-0.5">
                      <span className="text-slate-500">
                        Workload: <strong>{course.weeklyHours.lecture + course.weeklyHours.lab + course.weeklyHours.study}h/wk</strong>
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">
                        Difficulty: <strong>{course.difficulty.toFixed(1)}/5</strong>
                      </span>

                      {/* Prerequisite status tag */}
                      {course.prerequisites.length > 0 && (
                        <>
                          <span className="text-slate-400">·</span>
                          {prereqValidation.satisfied ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Prereqs Ready ({course.prerequisites.join(', ')})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Missing Prereq: {prereqValidation.missingPrereqs.join(', ')}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Add action button */}
                  <div className="shrink-0 flex items-center justify-end">
                    {isAlreadyAdded ? (
                      <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-500 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        In Term
                      </span>
                    ) : (
                      <button
                        onClick={() => addCourseToSemester(semesterId, course.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                          prereqValidation.satisfied
                            ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Course</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Showing {filteredCourses.length} available courses
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
