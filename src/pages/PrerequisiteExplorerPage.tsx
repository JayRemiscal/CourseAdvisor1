import React, { useState, useMemo, useEffect } from 'react';
import { 
  GitFork, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Unlock, 
  Lock, 
  Info, 
  Layers, 
  Sparkles, 
  ChevronRight, 
  RotateCcw,
  BookOpen,
  GraduationCap,
  Activity,
  ShieldCheck,
  Check,
  Zap,
  Repeat
} from 'lucide-react';
import { COURSES_DATA, COURSE_BY_CODE_MAP, COURSE_BY_ID_MAP } from '../data/coursesData';
import { Course } from '../types/academic';
import { useAcademic } from '../context/AcademicContext';
import { 
  runBackwardChaining, 
  computeKahnTopologicalSort, 
  detectGraphCycles, 
  buildPrerequisiteGraphData,
  getCourseStatus,
  TopologicalSortResult
} from '../utils/prerequisiteEngine';
import { PrerequisiteGraphView } from '../components/prerequisites/PrerequisiteGraphView';
import { BackwardChainingExplainer } from '../components/prerequisites/BackwardChainingExplainer';
import { KahnTiersViewer } from '../components/prerequisites/KahnTiersViewer';
import { PrerequisiteEngineValidator } from '../components/prerequisites/PrerequisiteEngineValidator';
import { CustomSelect, CustomSelectOption } from '../components/common/CustomSelect';

interface PrerequisiteExplorerPageProps {
  onOpenCourse: (courseId: string) => void;
  initialCourseCode?: string;
  onNavigate?: (page: string) => void;
}

export type PrereqViewTab = 'graph' | 'backward-chaining' | 'kahn-tiers' | 'validator';

export const PrerequisiteExplorerPage: React.FC<PrerequisiteExplorerPageProps> = ({
  onOpenCourse,
  initialCourseCode,
  onNavigate,
}) => {
  const { 
    gradeRecords, 
    activePlan, 
    checkCoursePrerequisites 
  } = useAcademic();

  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(initialCourseCode || 'ENS035');
  const [activeTab, setActiveTab] = useState<PrereqViewTab>('graph');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Synchronize when initialCourseCode changes from external navigation
  useEffect(() => {
    if (initialCourseCode && COURSE_BY_CODE_MAP.has(initialCourseCode)) {
      setSelectedCourseCode(initialCourseCode);
    }
  }, [initialCourseCode]);

  // Set of courses completed with passing grade
  const completedCodes = useMemo(() => {
    return new Set(
      gradeRecords
        .filter(r => r.grade !== 'F' && r.grade !== '5.0' && r.grade !== 'INC' && r.grade !== 'IP')
        .map(r => r.courseCode)
    );
  }, [gradeRecords]);

  // Set of courses currently in progress
  const currentEnrolledCodes = useMemo(() => {
    const currentSem = activePlan.semesters.find(s => s.isCurrent);
    if (!currentSem) return new Set<string>();
    return new Set(
      currentSem.courseIds
        .map(id => COURSE_BY_ID_MAP.get(id)?.code)
        .filter(Boolean) as string[]
    );
  }, [activePlan]);

  // Kahn's Topological Sort calculation
  const topologicalResult = useMemo<TopologicalSortResult>(() => {
    return computeKahnTopologicalSort(COURSES_DATA);
  }, []);

  // Backward chaining result for the currently selected course
  const backwardChainingResult = useMemo(() => {
    return runBackwardChaining(selectedCourseCode, completedCodes, currentEnrolledCodes);
  }, [selectedCourseCode, completedCodes, currentEnrolledCodes]);

  // Graph data representation for SVG canvas
  const graphData = useMemo(() => {
    return buildPrerequisiteGraphData(
      COURSES_DATA,
      selectedCourseCode,
      completedCodes,
      currentEnrolledCodes,
      topologicalResult
    );
  }, [selectedCourseCode, completedCodes, currentEnrolledCodes, topologicalResult]);

  const selectedCourse = COURSE_BY_CODE_MAP.get(selectedCourseCode) || COURSES_DATA[0];

  // Distinct departments for filter
  const departments = useMemo(() => {
    const depts = new Set<string>();
    COURSES_DATA.forEach(c => depts.add(c.department));
    return ['ALL', ...Array.from(depts).sort()];
  }, []);

  // Filtered course options for quick dropdown
  const filteredCoursesForPicker = useMemo(() => {
    return COURSES_DATA.filter(c => {
      if (deptFilter !== 'ALL' && c.department !== deptFilter) return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        return c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
      }
      return true;
    });
  }, [deptFilter, searchFilter]);

  // Metrics summary
  const summaryMetrics = useMemo(() => {
    let availableCount = 0;
    let blockedCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;

    for (const c of COURSES_DATA) {
      const status = getCourseStatus(c.code, completedCodes, currentEnrolledCodes);
      if (status === 'completed') completedCount++;
      else if (status === 'in-progress') inProgressCount++;
      else if (status === 'available') availableCount++;
      else blockedCount++;
    }

    return {
      availableCount,
      blockedCount,
      inProgressCount,
      completedCount,
      totalCount: COURSES_DATA.length,
    };
  }, [completedCodes, currentEnrolledCodes]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#17365D] text-white">
                Prerequisite Calculation Engine
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Directed Acyclic Graph (DAG) · Backward Chaining · Kahn's Topological Sorting
              </span>
            </div>
            
            <h2 className="text-xl sm:text-3xl font-extrabold text-[#17365D] tracking-tight">
              Prerequisite Explorer & Academic Dependency Graph
            </h2>
            
            <p className="text-xs text-[#64748B] max-w-3xl leading-relaxed">
              Explore prerequisite pathways, test backward-chaining availability proofs, and inspect Kahn's topological tiers. Courses are evaluated against your actual completion records to show real readiness.
            </p>
          </div>

          {/* Quick Metrics Badges - 2x2 grid on mobile, 4-col on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto shrink-0">
            <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Passed</span>
              <span className="text-base font-extrabold text-emerald-700 font-mono tabular-nums">{summaryMetrics.completedCount}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-[10px] font-bold text-blue-800 uppercase block">In Progress</span>
              <span className="text-base font-extrabold text-blue-700 font-mono tabular-nums">{summaryMetrics.inProgressCount}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
              <span className="text-[10px] font-bold text-indigo-800 uppercase block">Ready</span>
              <span className="text-base font-extrabold text-indigo-700 font-mono tabular-nums">{summaryMetrics.availableCount}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Blocked</span>
              <span className="text-base font-extrabold text-amber-700 font-mono tabular-nums">{summaryMetrics.blockedCount}</span>
            </div>
          </div>
        </div>

        {/* Course Selection & Filter Toolbar */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
              <span className="text-xs font-bold text-[#17365D] whitespace-nowrap">
                Target Course:
              </span>
              
              <div className="w-full sm:w-80 min-w-0">
                <CustomSelect
                  value={selectedCourseCode}
                  onChange={setSelectedCourseCode}
                  options={COURSES_DATA.map(c => ({
                    value: c.code,
                    label: `${c.code}: ${c.title}`,
                    sublabel: `${c.credits} cr · ${c.department}`,
                  }))}
                  size="sm"
                  className="rounded-xl border-slate-300"
                />
              </div>

              {/* Department Quick Filter & Syllabus Button - 2 columns on mobile */}
              <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
                <div className="w-full sm:w-44 min-w-0">
                  <CustomSelect
                    value={deptFilter}
                    onChange={setDeptFilter}
                    options={departments.map(dept => ({
                      value: dept,
                      label: dept === 'ALL' ? 'All Departments' : `Dept: ${dept}`,
                    }))}
                    size="sm"
                    className="rounded-xl border-slate-300"
                  />
                </div>

                <button
                  onClick={() => onOpenCourse(selectedCourse.id)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <span>Syllabus Specs</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Target Presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">
            <span className="text-[11px] text-slate-400 font-semibold w-full sm:w-auto">Test Presets:</span>
            <button
              onClick={() => setSelectedCourseCode('MAT051')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                selectedCourseCode === 'MAT051' ? 'bg-[#17365D] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              MAT051 (Zero Prereq)
            </button>
            <button
              onClick={() => setSelectedCourseCode('ENS022')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                selectedCourseCode === 'ENS022' ? 'bg-[#17365D] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ENS022 (1 Prereq)
            </button>
            <button
              onClick={() => setSelectedCourseCode('ENS035')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                selectedCourseCode === 'ENS035' ? 'bg-[#17365D] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ENS035 (Multi-Prereq Gateway)
            </button>
            <button
              onClick={() => setSelectedCourseCode('ENS197')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                selectedCourseCode === 'ENS197' ? 'bg-[#17365D] text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ENS197 (Deep Practicum Chain)
            </button>
          </div>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('graph')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-none ${
            activeTab === 'graph'
              ? 'bg-[#17365D] text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          Interactive Dependency Graph
        </button>

        <button
          onClick={() => setActiveTab('backward-chaining')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-none ${
            activeTab === 'backward-chaining'
              ? 'bg-[#17365D] text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#F4C95D]" />
          Backward-Chaining Advisor
        </button>

        <button
          onClick={() => setActiveTab('kahn-tiers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-none ${
            activeTab === 'kahn-tiers'
              ? 'bg-[#17365D] text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Kahn's Topological Tiers (0–5)
        </button>

        <button
          onClick={() => setActiveTab('validator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#2563EB] focus:outline-none ${
            activeTab === 'validator'
              ? 'bg-[#17365D] text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Algorithm Validator (7 Test Suites)
        </button>
      </div>

      {/* Main Tab Content Panels */}
      {activeTab === 'graph' && (
        <div className="space-y-6">
          <PrerequisiteGraphView
            graphData={graphData}
            selectedCourseCode={selectedCourseCode}
            onSelectCourse={setSelectedCourseCode}
            onOpenCourseModal={onOpenCourse}
            topologicalResult={topologicalResult}
          />

          {/* Connected Explainer below Graph */}
          <BackwardChainingExplainer
            backwardResult={backwardChainingResult}
            completedCodes={completedCodes}
            inProgressCodes={currentEnrolledCodes}
            gradeRecords={gradeRecords}
            onSelectCourse={setSelectedCourseCode}
            onOpenCourseModal={onOpenCourse}
          />
        </div>
      )}

      {activeTab === 'backward-chaining' && (
        <BackwardChainingExplainer
          backwardResult={backwardChainingResult}
          completedCodes={completedCodes}
          inProgressCodes={currentEnrolledCodes}
          gradeRecords={gradeRecords}
          onSelectCourse={setSelectedCourseCode}
          onOpenCourseModal={onOpenCourse}
        />
      )}

      {activeTab === 'kahn-tiers' && (
        <KahnTiersViewer
          topologicalResult={topologicalResult}
          completedCodes={completedCodes}
          inProgressCodes={currentEnrolledCodes}
          onSelectCourse={setSelectedCourseCode}
          onOpenCourseModal={onOpenCourse}
          selectedCourseCode={selectedCourseCode}
        />
      )}

      {activeTab === 'validator' && (
        <PrerequisiteEngineValidator
          completedCodes={completedCodes}
          inProgressCodes={currentEnrolledCodes}
          onSelectCourse={setSelectedCourseCode}
          onOpenCourseModal={onOpenCourse}
        />
      )}

    </div>
  );
};
