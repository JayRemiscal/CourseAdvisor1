import React from 'react';
import { 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  ShieldAlert, 
  Check, 
  HelpCircle,
  X,
  Layers
} from 'lucide-react';
import { MoveValidationResult } from '../../types/academic';
import { COURSE_BY_CODE_MAP } from '../../data/coursesData';

interface MoveConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseCode: string;
  courseTitle: string;
  targetSemesterName: string;
  sourceSemesterName: string;
  validation: MoveValidationResult;
  onConfirmOverride?: () => void;
}

export const MoveConflictModal: React.FC<MoveConflictModalProps> = ({
  isOpen,
  onClose,
  courseCode,
  courseTitle,
  targetSemesterName,
  sourceSemesterName,
  validation,
  onConfirmOverride,
}) => {
  if (!isOpen) return null;

  const isDuplicate = validation.conflictType === 'duplicate_course';
  const isDownstreamBroken = validation.conflictType === 'downstream_broken';
  const isPrereqLaterOrSame = validation.conflictType === 'prereq_same_or_later';
  const isCreditOverload = validation.conflictType === 'credit_overload';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Banner */}
        <div className="bg-rose-600 text-white p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-200 block">
                Schedule Validation Engine
              </span>
              <h3 className="text-lg font-extrabold text-white">
                {isDuplicate
                  ? 'Duplicate Course Conflict'
                  : isDownstreamBroken
                  ? 'Downstream Dependency Violation'
                  : isPrereqLaterOrSame
                  ? 'Prerequisite Sequencing Conflict'
                  : isCreditOverload
                  ? 'Credit Limit Exceeded'
                  : 'Invalid Move Blocked'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* Movement Context Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Course</span>
              <strong className="text-[#17365D] font-mono font-bold text-sm">
                {courseCode}
              </strong>
              <span className="text-slate-600 block line-clamp-1 text-[11px]">
                {courseTitle}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[11px] font-medium text-slate-500">{sourceSemesterName}</span>
              <ArrowRight className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-900 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                {targetSemesterName}
              </span>
            </div>
          </div>

          {/* Validation Message Box */}
          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-900 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">
                {validation.message}
              </p>
            </div>

            {/* Conflicting Courses Tags */}
            {validation.conflictingCourses && validation.conflictingCourses.length > 0 && (
              <div className="pt-2 border-t border-rose-200/60 flex items-center gap-2 flex-wrap text-[11px]">
                <span className="font-bold text-rose-800">Involved Course(s):</span>
                {validation.conflictingCourses.map(code => {
                  const c = COURSE_BY_CODE_MAP.get(code);
                  return (
                    <span 
                      key={code}
                      className="px-2 py-0.5 rounded bg-white border border-rose-300 font-mono font-bold text-rose-900 shadow-2xs"
                    >
                      {code} {c ? `· ${c.title.slice(0, 18)}...` : ''}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resolution Advice */}
          {validation.suggestedAction && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-slate-700 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-blue-900 font-bold block mb-0.5">
                  Recommended Academic Resolution:
                </strong>
                <p className="text-[11px] text-slate-600 leading-normal">
                  {validation.suggestedAction}
                </p>
              </div>
            </div>
          )}

          {/* Institutional Integrity Note */}
          <p className="text-[10px] text-slate-400 italic">
            * The academic planner rejects invalid prerequisite schedules to prevent curricular disqualification during graduation clearance.
          </p>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#17365D] hover:bg-[#234876] text-white transition-colors"
          >
            Acknowledge & Cancel Move
          </button>
        </div>

      </div>
    </div>
  );
};
