import React, { useState } from 'react';
import { 
  GitFork, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Unlock, 
  Lock, 
  Info, 
  Layers, 
  ChevronRight, 
  Filter,
  Search,
  ExternalLink,
  Award
} from 'lucide-react';
import { Course } from '../../types/academic';
import { TopologicalSortResult, CourseStatusType } from '../../utils/prerequisiteEngine';

interface KahnTiersViewerProps {
  topologicalResult: TopologicalSortResult;
  completedCodes: Set<string>;
  inProgressCodes: Set<string>;
  onSelectCourse: (code: string) => void;
  onOpenCourseModal: (courseId: string) => void;
  selectedCourseCode: string;
}

export const KahnTiersViewer: React.FC<KahnTiersViewerProps> = ({
  topologicalResult,
  completedCodes,
  inProgressCodes,
  onSelectCourse,
  onOpenCourseModal,
  selectedCourseCode,
}) => {
  const [selectedTierFilter, setSelectedTierFilter] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (topologicalResult.hasCycle) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 space-y-3">
        <h3 className="text-lg font-bold flex items-center gap-2 text-rose-800">
          Topological Sort Suspended: Circular Prerequisite Cycle Detected
        </h3>
        <p className="text-xs text-rose-700">
          Kahn's algorithm requires a Directed Acyclic Graph (DAG). The cycle must be resolved before a valid course progression order can be computed.
        </p>
        <div className="font-mono text-xs bg-white p-3 rounded-lg border border-rose-200 text-rose-900">
          {topologicalResult.errorMessage}
        </div>
      </div>
    );
  }

  const getStatusBadge = (course: Course) => {
    if (completedCodes.has(course.code)) {
      return {
        label: 'Passed',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        icon: CheckCircle2,
      };
    }
    if (inProgressCodes.has(course.code)) {
      return {
        label: 'In Progress',
        bg: 'bg-blue-50 text-blue-700 border-blue-300',
        icon: Clock,
      };
    }
    const allPrereqsMet = course.prerequisites.every(p => completedCodes.has(p));
    if (allPrereqsMet) {
      return {
        label: 'Available',
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-300',
        icon: Unlock,
      };
    }
    return {
      label: 'Locked',
      bg: 'bg-slate-100 text-slate-500 border-slate-200',
      icon: Lock,
    };
  };

  const filteredTiers = topologicalResult.tiers.filter(tier => {
    if (selectedTierFilter !== 'ALL' && tier.tierIndex !== selectedTierFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#17365D] text-white">
              Kahn's Algorithm & Topological Tiers
            </span>
            <span className="text-xs text-slate-500">
              Zero In-Degree Queue Resolution (Acyclic Curriculum)
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-[#17365D]">
            Curriculum Dependency Tiers & Progression Order
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Courses are partitioned into verified dependency generations. Every course in Tier <em>k</em> requires only courses from prior tiers (0 to <em>k - 1</em>), mathematically preventing scheduling prior to prerequisite clearance.
          </p>
        </div>

        {/* Tier filter pill buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedTierFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              selectedTierFilter === 'ALL'
                ? 'bg-[#17365D] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Tiers ({topologicalResult.sortedCodes.length})
          </button>
          {topologicalResult.tiers.map(t => (
            <button
              key={t.tierIndex}
              onClick={() => setSelectedTierFilter(t.tierIndex)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedTierFilter === t.tierIndex
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tier {t.tierIndex}
            </button>
          ))}
        </div>
      </div>

      {/* Tiers List */}
      <div className="space-y-6">
        {filteredTiers.map(tier => {
          const tierCourses = tier.courses.filter(c => {
            if (!searchTerm.trim()) return true;
            const q = searchTerm.toLowerCase();
            return c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
          });

          return (
            <div 
              key={tier.tierIndex}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#17365D] text-amber-400 font-extrabold flex items-center justify-center text-sm shadow-2xs">
                    T{tier.tierIndex}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#17365D]">
                      {tier.title}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {tier.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {tier.courses.length} Course{tier.courses.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Course grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {tierCourses.map(course => {
                  const status = getStatusBadge(course);
                  const StatusIcon = status.icon;
                  const isSelected = selectedCourseCode === course.code;

                  return (
                    <div
                      key={course.code}
                      onClick={() => onSelectCourse(course.code)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'ring-2 ring-[#2563EB] bg-blue-50/90 border-[#2563EB] shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-[#17365D] text-white">
                            {course.code}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${status.bg}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>

                        <h5 className="font-bold text-xs text-slate-900 line-clamp-1">
                          {course.title}
                        </h5>

                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {course.credits} Credits · {course.department}
                        </p>
                      </div>

                      {/* Prerequisites info */}
                      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">
                          {course.prerequisites.length === 0 ? (
                            <span className="text-emerald-700 font-medium">No Prereqs</span>
                          ) : (
                            <span>Prereq: <strong>{course.prerequisites.join(', ')}</strong></span>
                          )}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCourseModal(course.id);
                          }}
                          className="text-[#2563EB] hover:underline font-bold"
                          title="View course syllabus"
                        >
                          Specs
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
