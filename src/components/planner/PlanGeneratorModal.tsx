import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Sliders, 
  ArrowRight,
  BookOpen,
  Info,
  GraduationCap
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { AutoPlanningInputs, TermType } from '../../types/academic';
import { TARGET_GRADUATION_CREDITS } from '../../data/degreeRequirements';
import { CustomSelect } from '../common/CustomSelect';

interface PlanGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlanGeneratorModal: React.FC<PlanGeneratorModalProps> = ({ isOpen, onClose }) => {
  const { 
    profile, 
    generateNewPlan, 
    completedCreditsCount, 
    inProgressCreditsCount, 
    remainingCreditsCount,
    gradeRecords 
  } = useAcademic();

  // Student inputs
  const [degreeProgram, setDegreeProgram] = useState(
    'Bachelor of Science in Environmental Science (BSES) - 168 Units'
  );
  const [currentYearLevel, setCurrentYearLevel] = useState<number>(2);
  const [startingYear, setStartingYear] = useState<number>(2);
  const [startingTerm, setStartingTerm] = useState<TermType>('Fall');
  const [startingAcademicYear, setStartingAcademicYear] = useState<string>('2025–2026');
  const [targetCreditsPerSemester, setTargetCreditsPerSemester] = useState<number>(18);
  const [planningHorizonSemesters, setPlanningHorizonSemesters] = useState<number>(6); // 6 terms = 3 years
  const [includeSummerTerms, setIncludeSummerTerms] = useState<boolean>(true);
  const [includeCompletedForReview, setIncludeCompletedForReview] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    const inputs: AutoPlanningInputs = {
      degreeProgram,
      currentYearLevel,
      startingTerm,
      startingYear,
      startingAcademicYear,
      targetCreditsPerSemester,
      planningHorizonSemesters,
      includeSummerTerms,
      includeCompletedForReview,
    };

    setTimeout(() => {
      generateNewPlan(inputs);
      setIsGenerating(false);
      onClose();
    }, 450);
  };

  const completedCount = gradeRecords.filter(r => r.grade !== 'F' && r.grade !== 'IP').length;
  const inProgressCount = gradeRecords.filter(r => r.grade === 'IP').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-2xl w-full max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Fixed at top */}
        <div className="bg-[#17365D] text-white p-4 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-5 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F4C95D] text-[#17365D] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Automated Academic Planner
            </span>
            <span className="text-white/60 text-xs hidden sm:inline">Kahn's Topological Engine</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Generate Suggested Academic Plan
          </h2>
          <p className="text-xs text-blue-100/90 mt-1 max-w-xl leading-relaxed">
            Automatically schedules remaining requirements into valid semesters using Kahn's topological sort and credit load balancing.
          </p>
        </div>

        {/* Current Student Progress Summary Banner - Fixed */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#2563EB]" />
            <span className="text-slate-600">Active Student:</span>
            <strong className="text-[#17365D] font-bold">{profile.name}</strong>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-[11px] flex-wrap">
            <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              ✓ Passed: {completedCreditsCount} cr
            </span>
            <span className="text-blue-700 font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
              ⏳ In Progress: {inProgressCreditsCount} cr
            </span>
            <span className="text-slate-600 font-semibold">
              Remaining: {remainingCreditsCount} cr
            </span>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleGenerate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Degree Program & Current Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Degree Program Curriculum
              </label>
              <CustomSelect
                value={degreeProgram}
                onChange={setDegreeProgram}
                options={[
                  {
                    value: 'Bachelor of Science in Environmental Science (BSES) - 168 Units',
                    label: 'MSU-Naawan BS in Environmental Science (168 Total Units)',
                  },
                ]}
                size="sm"
                className="rounded-xl border-slate-200"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                BOR Res. 357 S. 2018 / APC Res. 34 S. 2018 (Full 4-Year Matrix)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Current Student Year Level
              </label>
              <CustomSelect<number>
                value={currentYearLevel}
                onChange={val => {
                  setCurrentYearLevel(val);
                  setStartingYear(val);
                }}
                options={[
                  { value: 1, label: '1st Year (Freshman)' },
                  { value: 2, label: '2nd Year (Sophomore) · Current' },
                  { value: 3, label: '3rd Year (Junior)' },
                  { value: 4, label: '4th Year (Senior)' },
                ]}
                size="sm"
                className="rounded-xl border-slate-200"
              />
            </div>
          </div>

          {/* Starting Term & Academic Calendar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preferred Starting Semester
              </label>
              <CustomSelect<TermType>
                value={startingTerm}
                onChange={setStartingTerm}
                options={[
                  { value: 'Fall', label: '1st Semester (Fall)' },
                  { value: 'Spring', label: '2nd Semester (Spring)' },
                  { value: 'Summer', label: 'Summer Session' },
                ]}
                size="sm"
                className="rounded-lg border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Starting Year Level
              </label>
              <CustomSelect<number>
                value={startingYear}
                onChange={setStartingYear}
                options={[
                  { value: 1, label: 'Year 1' },
                  { value: 2, label: 'Year 2' },
                  { value: 3, label: 'Year 3' },
                  { value: 4, label: 'Year 4' },
                ]}
                size="sm"
                className="rounded-lg border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Academic Year (e.g. 2025–2026)
              </label>
              <input
                type="text"
                value={startingAcademicYear}
                onChange={e => setStartingAcademicYear(e.target.value)}
                placeholder="2025–2026"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>
          </div>

          {/* Target Credits & Planning Horizon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Target Credits per Semester
                </label>
                <span className="text-xs font-mono font-extrabold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {targetCreditsPerSemester} Credits
                </span>
              </div>
              <input
                type="range"
                min={12}
                max={24}
                step={1}
                value={targetCreditsPerSemester}
                onChange={e => setTargetCreditsPerSemester(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>12 cr (Light)</span>
                <span>18 cr (Standard)</span>
                <span>21 cr (Rigor)</span>
                <span>24 cr (Max)</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Academic Planning Horizon
              </label>
              <CustomSelect<number>
                value={planningHorizonSemesters}
                onChange={setPlanningHorizonSemesters}
                options={[
                  { value: 2, label: 'Next 2 Semesters (1 Academic Year)' },
                  { value: 4, label: 'Next 4 Semesters (2 Academic Years)' },
                  { value: 6, label: 'Next 6 Semesters (3 Academic Years)' },
                  { value: 8, label: 'Full 8 Semesters (Complete 4-Year Schedule)' },
                  { value: 0, label: 'All Remaining Semesters to Degree Clearance' },
                ]}
                size="sm"
                className="rounded-xl border-slate-200"
              />
              <p className="text-[10px] text-slate-400">
                Determines how many forward academic terms to construct and schedule.
              </p>
            </div>
          </div>

          {/* Advanced Constraints & Review Options */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs">
            <span className="font-bold text-slate-700 block text-xs">
              Curriculum & Sequencing Rules
            </span>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSummerTerms}
                onChange={e => setIncludeSummerTerms(e.target.checked)}
                className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB] mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-800">
                  Include 3rd Year Summer Gateway (ENS035 EIA & GEC123)
                </span>
                <p className="text-[11px] text-slate-500">
                  Schedules the official 5-unit Field Gateway during summer as prescribed in BOR Res. 357 S. 2018.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeCompletedForReview}
                onChange={e => setIncludeCompletedForReview(e.target.checked)}
                className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB] mt-0.5"
              />
              <div>
                <span className="font-semibold text-slate-800">
                  Include Passed Terms for Complete 4-Year Audit
                </span>
                <p className="text-[11px] text-slate-500">
                  Retains completed First Year terms in the roadmap for a comprehensive 168-unit overview.
                </p>
              </div>
            </label>
          </div>

          {/* Algorithmic Disclosure Notice */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-blue-900 font-bold block mb-0.5">
                Transparent Sequencing Notice
              </strong>
              Placement uses Kahn's topological sort to guarantee that prerequisites are completed prior to courses depending on them. It balances credits around your target of {targetCreditsPerSemester} cr/term. No arbitrary optimization claims are made.
            </div>
          </div>

          </div>

          {/* Sticky Action Footer */}
          <div className="p-4 bg-white border-t border-slate-200 shrink-0 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Schedule...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#F4C95D]" />
                  <span>Generate Academic Plan</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
