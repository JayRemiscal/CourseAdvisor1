import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Unlock, 
  Lock, 
  AlertTriangle, 
  ArrowRight, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  ExternalLink,
  BookOpen,
  Info,
  Layers,
  CornerDownRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Course, GradeRecord } from '../../types/academic';
import { 
  BackwardChainingResult, 
  PrerequisiteNode,
  CourseStatusType 
} from '../../utils/prerequisiteEngine';
import { COURSE_BY_CODE_MAP } from '../../data/coursesData';

interface BackwardChainingExplainerProps {
  backwardResult: BackwardChainingResult;
  completedCodes: Set<string>;
  inProgressCodes: Set<string>;
  gradeRecords: GradeRecord[];
  onSelectCourse: (code: string) => void;
  onOpenCourseModal: (courseId: string) => void;
}

export const BackwardChainingExplainer: React.FC<BackwardChainingExplainerProps> = ({
  backwardResult,
  completedCodes,
  inProgressCodes,
  gradeRecords,
  onSelectCourse,
  onOpenCourseModal,
}) => {
  const [isTreeExpanded, setIsTreeExpanded] = useState<boolean>(true);
  const targetCourse = backwardResult.targetCourse;

  const gradeMap = new Map<string, GradeRecord>();
  gradeRecords.forEach(r => gradeMap.set(r.courseCode, r));

  const renderRecursiveTreeNode = (node: PrerequisiteNode, isRoot: boolean = false) => {
    const course = node.course || COURSE_BY_CODE_MAP.get(node.code);
    const gradeRec = gradeMap.get(node.code);

    let statusBadge = {
      label: 'Prereq Missing',
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: Lock,
    };

    if (node.isCompleted) {
      statusBadge = {
        label: gradeRec ? `Passed (${gradeRec.grade})` : 'Completed',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        icon: CheckCircle2,
      };
    } else if (node.isInProgress) {
      statusBadge = {
        label: 'In Progress (Current Sem)',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Clock,
      };
    } else if (node.status === 'available') {
      statusBadge = {
        label: 'Ready to Enroll',
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: Unlock,
      };
    }

    const StatusIcon = statusBadge.icon;

    return (
      <div key={`${node.code}-${node.depth}`} className="relative">
        <div className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          isRoot 
            ? 'bg-gradient-to-r from-[#17365D] to-[#1E3A8A] text-white border-[#17365D] shadow-md' 
            : node.isCompleted 
            ? 'bg-emerald-50/70 border-emerald-200' 
            : node.isInProgress
            ? 'bg-blue-50/70 border-blue-200'
            : node.status === 'available'
            ? 'bg-indigo-50/70 border-indigo-200'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            {!isRoot && (
              <span className="text-slate-400 font-mono text-xs hidden sm:inline">
                Depth {node.depth}
              </span>
            )}
            
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold ${
                isRoot ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-white'
              }`}>
                {node.code}
              </span>
              <div>
                <h5 className={`font-bold text-xs sm:text-sm ${isRoot ? 'text-white' : 'text-slate-900'}`}>
                  {course?.title || node.code}
                </h5>
                <p className={`text-[11px] ${isRoot ? 'text-blue-100' : 'text-slate-500'}`}>
                  {course ? `${course.credits} Credits · ${course.department} · Level ${course.level}` : 'External / Mandated Course'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Status tag */}
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              isRoot ? 'bg-white/20 text-white border-white/30' : statusBadge.bg
            }`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {isRoot ? backwardResult.explanation.verdict : statusBadge.label}
            </span>

            {/* If completed, show branch cutoff message */}
            {node.isCompleted && !isRoot && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                Branch Satisfied (Expansion Stopped)
              </span>
            )}

            {!isRoot && (
              <button
                onClick={() => onSelectCourse(node.code)}
                className="px-2.5 py-1 text-xs font-bold text-[#2563EB] hover:bg-white rounded-lg border border-transparent hover:border-slate-300"
              >
                Inspect Path →
              </button>
            )}

            {course && (
              <button
                onClick={() => onOpenCourseModal(course.id)}
                className={`p-1.5 rounded-lg text-xs ${
                  isRoot ? 'text-blue-200 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                }`}
                title="View course syllabus specs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Child Subtree */}
        {node.children.length > 0 && (
          <div className="pl-4 sm:pl-7 border-l-2 border-slate-200 mt-2 space-y-2 ml-3">
            {node.children.map(child => renderRecursiveTreeNode(child, false))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      
      {/* Target Course Explanation Header */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#17365D] text-white">
                Backward-Chaining Prerequisite Engine
              </span>
              <span className="text-xs text-slate-500">
                Recursive Path Discovery & Availability Proof
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-extrabold text-[#17365D] bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                {backwardResult.targetCode}
              </span>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {targetCourse?.title || backwardResult.targetCode}
                </h3>
                <p className="text-xs text-slate-500">
                  {targetCourse?.requirementCategory} · {targetCourse?.credits} Credits · Max Prerequisite Depth: Level {backwardResult.maxChainDepth}
                </p>
              </div>
            </div>
          </div>

          {/* Actionable Course Verdict Banner */}
          <div className="shrink-0">
            <div className={`p-4 rounded-xl border shadow-2xs flex items-center gap-3 ${
              backwardResult.explanation.verdictType === 'ready'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : backwardResult.explanation.verdictType === 'completed'
                ? 'bg-blue-50 border-blue-300 text-blue-950'
                : backwardResult.explanation.verdictType === 'in-progress'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}>
              {backwardResult.explanation.verdictType === 'ready' && (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              )}
              {backwardResult.explanation.verdictType === 'completed' && (
                <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
              )}
              {backwardResult.explanation.verdictType === 'in-progress' && (
                <Clock className="w-6 h-6 text-indigo-600 shrink-0" />
              )}
              {backwardResult.explanation.verdictType === 'blocked' && (
                <Lock className="w-6 h-6 text-amber-600 shrink-0" />
              )}
              
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block">
                  Status Verdict
                </span>
                <span className="font-extrabold text-sm sm:text-base">
                  {backwardResult.explanation.verdict}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Plain English Academic Explanation */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Academic Advisor Algorithmic Explanation:
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {backwardResult.explanation.actionableAdvice}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80 text-xs">
            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Direct Prerequisites
              </span>
              <span className="font-semibold text-slate-800">
                {backwardResult.explanation.directSummary}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Completed in Chain
              </span>
              <span className="font-semibold text-emerald-700">
                {backwardResult.completedUpstreamCodes.length} course(s) satisfied
              </span>
            </div>

            <div className="p-2 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Total Unmet Dependencies
              </span>
              <span className={`font-semibold ${backwardResult.unmetPrereqCodes.length === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {backwardResult.unmetPrereqCodes.length === 0 ? 'Zero unmet requirements' : `${backwardResult.unmetPrereqCodes.length} remaining courses`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Immediate Next Steps Section */}
      {backwardResult.targetStatus === 'blocked' && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-300 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Action Plan: What Should You Complete Next to Unlock {backwardResult.targetCode}?
              </h4>
            </div>
            <span className="text-[11px] font-semibold text-amber-800">
              {backwardResult.immediateNextSteps.length} Actionable Course(s) Ready
            </span>
          </div>

          {backwardResult.immediateNextSteps.length === 0 ? (
            <p className="text-xs text-slate-600 bg-white/80 p-3 rounded-lg border border-amber-200">
              All uncompleted courses on this path currently have their own pending prerequisites. Check your in-progress courses or review foundational science requirements.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {backwardResult.immediateNextSteps.map(code => {
                const course = COURSE_BY_CODE_MAP.get(code);
                return (
                  <div
                    key={code}
                    className="p-3 rounded-xl bg-white border border-amber-300 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-[#17365D] text-white">
                          {code}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Ready Now
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 line-clamp-1">
                        {course?.title || code}
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {course?.credits} Credits · {course?.department}
                      </p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => onSelectCourse(code)}
                        className="text-xs font-bold text-[#2563EB] hover:underline"
                      >
                        Inspect Dependencies →
                      </button>
                      {course && (
                        <button
                          onClick={() => onOpenCourseModal(course.id)}
                          className="text-xs text-slate-400 hover:text-slate-700"
                        >
                          Details
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recursive Backward Chaining Tree Visualization */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div 
          onClick={() => setIsTreeExpanded(!isTreeExpanded)}
          className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#17365D]" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#17365D]">
              Backward-Chaining Execution Tree
            </h4>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (Recursively unrolled; stops expanding branches upon reaching completed prerequisites)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              {isTreeExpanded ? 'Collapse Tree' : 'Expand Tree'}
            </span>
            {isTreeExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          </div>
        </div>

        {isTreeExpanded && (
          <div className="p-4 space-y-4 bg-white overflow-x-auto">
            {renderRecursiveTreeNode(backwardResult.rootNode, true)}
          </div>
        )}
      </div>

    </div>
  );
};
