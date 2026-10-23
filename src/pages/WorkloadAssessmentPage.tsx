import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  TrendingUp, 
  BarChart3, 
  Sparkles, 
  Info,
  Calendar,
  Layers,
  ChevronRight,
  Sliders,
  Calculator,
  ShieldCheck,
  Award,
  BookOpen,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { COURSE_BY_ID_MAP } from '../data/coursesData';
import { Course } from '../types/academic';
import { FuzzyWorkloadGauge } from '../components/workload/FuzzyWorkloadGauge';
import { MamdaniInferenceVisualizer } from '../components/workload/MamdaniInferenceVisualizer';
import { MamdaniTestSuitePanel } from '../components/workload/MamdaniTestSuitePanel';
import { CourseConfidenceModal } from '../components/workload/CourseConfidenceModal';
import { evaluateMamdaniFIS } from '../utils/fuzzyInferenceEngine';
import { CustomSelect, CustomSelectOption } from '../components/common/CustomSelect';

interface WorkloadAssessmentPageProps {
  onOpenCourse: (courseId: string) => void;
}

export const WorkloadAssessmentPage: React.FC<WorkloadAssessmentPageProps> = ({
  onOpenCourse,
}) => {
  const { 
    activePlan, 
    getSemesterWorkload, 
    getSemesterFuzzyWorkload,
    getCourseConfidence,
    setCourseConfidence,
    profile 
  } = useAcademic();

  const [activeTab, setActiveTab] = useState<'assessment' | 'visualizer' | 'tests'>('assessment');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(
    activePlan.semesters.find(s => s.isCurrent)?.id || activePlan.semesters[0]?.id || ''
  );
  const [inspectCourseId, setInspectCourseId] = useState<string | null>(null);
  const [confidenceModalCourse, setConfidenceModalCourse] = useState<Course | null>(null);

  const selectedSemester = activePlan.semesters.find(s => s.id === selectedSemesterId) || activePlan.semesters[0];
  const workload = getSemesterWorkload(selectedSemester?.id || '');
  const fuzzyAssessment = getSemesterFuzzyWorkload(selectedSemester?.id || '');

  const coursesInSelectedSem: Course[] = useMemo(() => {
    return (selectedSemester?.courseIds || [])
      .map(id => COURSE_BY_ID_MAP.get(id))
      .filter((c): c is Course => c !== undefined);
  }, [selectedSemester]);

  const termOptions: CustomSelectOption[] = useMemo(() => {
    return activePlan.semesters.map(sem => ({
      value: sem.id,
      label: `${sem.name.replace(/\s*\(Current\)/i, '')} (${sem.academicYear})`,
      badge: sem.isCompleted ? 'Completed' : sem.isCurrent ? 'Current' : undefined,
      badgeColor: sem.isCompleted ? 'emerald' : sem.isCurrent ? 'blue' : undefined,
    }));
  }, [activePlan.semesters]);

  const inspectCourseOptions: CustomSelectOption[] = useMemo(() => {
    return coursesInSelectedSem.map(c => ({
      value: c.id,
      label: `${c.code} · ${c.title}`,
      sublabel: `${c.credits} units`,
    }));
  }, [coursesInSelectedSem]);

  // Selected course for individual Mamdani visualizer tab
  const activeInspectCourse = useMemo(() => {
    if (inspectCourseId) {
      return COURSE_BY_ID_MAP.get(inspectCourseId) || coursesInSelectedSem[0] || null;
    }
    return coursesInSelectedSem[0] || null;
  }, [inspectCourseId, coursesInSelectedSem]);

  const activeInspectAssessment = useMemo(() => {
    if (!activeInspectCourse) return null;
    const confData = getCourseConfidence(activeInspectCourse.code);
    const diff = activeInspectCourse.difficultyRating || (activeInspectCourse.difficulty ? activeInspectCourse.difficulty * 2 : 5);
    return evaluateMamdaniFIS(confData.value, diff, { isSampleConfidence: confData.isSample });
  }, [activeInspectCourse, getCourseConfidence]);

  // Life balance calculation (168 hours total in a week)
  const weeklyStudyHours = workload.totalWeeklyHours;
  const sleepHours = 56; // 8h/day
  const personalHours = 28; // 4h/day
  const remainingFreeHours = Math.max(0, 168 - sleepHours - personalHours - weeklyStudyHours);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] sm:text-xs font-bold bg-[#17365D] text-white flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#F4C95D] shrink-0" />
                Mamdani Fuzzy Inference System
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Deterministic Workload & Stress Modeler
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#17365D] tracking-tight">
              Academic Workload & Stress Assessment
            </h2>
            <p className="text-xs text-[#64748B] mt-1 max-w-2xl leading-relaxed">
              Evaluates student confidence (1–10) and course difficulty (1–10) through documented triangular and trapezoidal membership functions, min-operator rule implication, and centroid defuzzification.
            </p>
          </div>

          {/* Term Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            <span className="text-xs font-bold text-slate-600 shrink-0">
              Term:
            </span>
            <div className="w-full sm:w-80 min-w-0">
              <CustomSelect
                value={selectedSemesterId}
                onChange={setSelectedSemesterId}
                options={termOptions}
                size="sm"
                className="rounded-xl border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls (Equal 3-column grid, no clipping) */}
        <div className="grid grid-cols-3 rounded-xl bg-slate-100/90 border border-slate-200/80 p-1 text-xs font-bold mt-4 sm:mt-5 w-full max-w-xl">
          <button
            onClick={() => setActiveTab('assessment')}
            className={`py-2 px-1 sm:px-3 rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-1.5 min-w-0 ${
              activeTab === 'assessment'
                ? 'bg-white text-[#17365D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2563EB] shrink-0" />
            <span className="truncate text-[11px] sm:text-xs">
              <span className="hidden sm:inline">Semester </span>Assessment
            </span>
          </button>

          <button
            onClick={() => setActiveTab('visualizer')}
            className={`py-2 px-1 sm:px-3 rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-1.5 min-w-0 ${
              activeTab === 'visualizer'
                ? 'bg-white text-[#17365D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2563EB] shrink-0" />
            <span className="truncate text-[11px] sm:text-xs">
              <span className="hidden sm:inline">Mamdani </span>Math Engine
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`py-2 px-1 sm:px-3 rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-1.5 min-w-0 ${
              activeTab === 'tests'
                ? 'bg-white text-[#17365D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span className="truncate text-[11px] sm:text-xs">
              <span className="hidden sm:inline">Sandbox & </span>Unit Tests
            </span>
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SEMESTER WORKLOAD ASSESSMENT */}
      {/* ========================================================================= */}
      {activeTab === 'assessment' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* 4 Core Workload KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Fuzzy Stress Index Gauge */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between items-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Fuzzy Stress Index (COG)
              </span>
              <FuzzyWorkloadGauge
                score={fuzzyAssessment.finalSemesterStressScore}
                category={fuzzyAssessment.semesterWorkloadCategory}
                subtitle="Credit-weighted Mamdani Centroid"
                size="md"
              />
            </div>

            {/* KPI 2: Credit Load Advisory Status */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>Enrolled Credit Units</span>
                  <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${
                    fuzzyAssessment.creditLoadStatus === 'Overload'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : fuzzyAssessment.creditLoadStatus === 'Underload'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    {fuzzyAssessment.creditLoadStatus}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-[#17365D]">
                    {fuzzyAssessment.totalCredits}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ 12–18 guideline</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  {fuzzyAssessment.creditLoadGuidelineMessage}
                </p>
              </div>

              <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
                <span>Load Multiplier:</span>
                <span className="font-mono font-bold text-slate-700">{fuzzyAssessment.creditLoadMultiplier}x</span>
              </div>
            </div>

            {/* KPI 3: Weekly Commitment Hours */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Weekly Academic Hours
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-[#17365D]">
                    {workload.totalWeeklyHours}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">hrs / week</span>
                </div>
                <div className="space-y-1 mt-2 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Lecture:</span>
                    <strong>{workload.lectureHours} hrs</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Laboratory:</span>
                    <strong>{workload.labHours} hrs</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Independent Study:</span>
                    <strong>{workload.studyHours} hrs</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
                <span>Burnout Risk:</span>
                <span className="font-bold text-slate-700">{workload.burnoutRisk}</span>
              </div>
            </div>

            {/* KPI 4: Top Stress Driver Course */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Top Stress Driver
                </span>
                {fuzzyAssessment.topStressDrivers.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-sm text-[#17365D]">
                        {fuzzyAssessment.topStressDrivers[0].courseCode}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {fuzzyAssessment.topStressDrivers[0].assessment.defuzzification.crispScore}/100 Stress
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-700 line-clamp-1">
                      {fuzzyAssessment.topStressDrivers[0].courseTitle}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {fuzzyAssessment.topStressDrivers[0].credits} units · Rigor {fuzzyAssessment.topStressDrivers[0].difficulty}/10
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-2">No registered courses.</p>
                )}
              </div>

              <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100">
                {fuzzyAssessment.topStressDrivers.length > 1 && (
                  <span>Secondary: {fuzzyAssessment.topStressDrivers[1].courseCode} ({fuzzyAssessment.topStressDrivers[1].assessment.defuzzification.crispScore}/100)</span>
                )}
              </div>
            </div>

          </div>

          {/* Credit Load Warning Banner (If outside recommended 12–18 units) */}
          {fuzzyAssessment.creditLoadStatus !== 'Recommended' && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs ${
              fuzzyAssessment.creditLoadStatus === 'Overload'
                ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                : 'bg-amber-50/80 border-amber-300 text-amber-950'
            }`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                fuzzyAssessment.creditLoadStatus === 'Overload' ? 'text-rose-600' : 'text-amber-600'
              }`} />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold">
                  {fuzzyAssessment.creditLoadStatus === 'Overload'
                    ? 'Credit Overload Advisory Notice'
                    : 'Part-Time Enrollment Advisory Notice'}
                </h4>
                <p className="text-[11px] leading-relaxed">
                  The recommended academic workload guideline is <strong>12 to 18 credit units</strong>. This semester contains <strong>{fuzzyAssessment.totalCredits} credit units</strong>.
                  {' '}While collegiate guidelines provide a standard benchmark, individual capacity, prerequisite urgency, working status, and departmental policies determine the most appropriate schedule.
                </p>
              </div>
            </div>
          )}

          {/* Course-by-Course Mamdani FIS Evaluation Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-[#17365D]">
                  Course Mamdani Assessment & Student Confidence Ratings
                </h3>
                <p className="text-xs text-slate-500">
                  Click on any course confidence rating to personalize your familiarization score (1 to 10).
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low (0-35)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Moderate (36-65)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> High (66-100)
                </span>
              </div>
            </div>

            {fuzzyAssessment.courseEntries.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No courses scheduled in this semester. Add courses in the Academic Planner to assess workload.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                      <th className="py-3 px-3">Course</th>
                      <th className="py-3 px-2 text-center">Units</th>
                      <th className="py-3 px-3 text-center">Syllabus Rigor (Difficulty)</th>
                      <th className="py-3 px-3 text-center">Student Confidence</th>
                      <th className="py-3 px-3 text-center">Mamdani Stress Index</th>
                      <th className="py-3 px-3">Workload Interpretation</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fuzzyAssessment.courseEntries.map(entry => {
                      const courseObj = COURSE_BY_ID_MAP.get(entry.courseCode) || COURSE_BY_ID_MAP.get(entry.courseCode.toLowerCase()) || coursesInSelectedSem.find(c => c.code === entry.courseCode);
                      const stress = entry.assessment.defuzzification.crispScore;
                      const isHighStress = stress > 65;
                      const isMedStress = stress > 35 && stress <= 65;

                      return (
                        <tr key={entry.courseCode} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3">
                            <span 
                              onClick={() => {
                                if (courseObj) onOpenCourse(courseObj.id);
                              }}
                              className="font-mono font-bold text-xs text-[#17365D] hover:text-[#2563EB] cursor-pointer block"
                            >
                              {entry.courseCode}
                            </span>
                            <span className="text-slate-700 font-medium line-clamp-1 text-[11px]">
                              {entry.courseTitle}
                            </span>
                          </td>

                          <td className="py-3 px-2 text-center font-bold text-slate-700">
                            {entry.credits}
                          </td>

                          {/* Difficulty (1-10) */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              ★ {entry.difficulty.toFixed(1)} / 10
                            </span>
                          </td>

                          {/* Student Confidence (1-10) */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                if (courseObj) setConfidenceModalCourse(courseObj);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold hover:border-blue-300 hover:bg-blue-50 transition-colors"
                              title="Click to edit personal confidence rating"
                            >
                              <span className="font-mono font-bold text-[#2563EB]">
                                {entry.confidence.toFixed(1)} / 10
                              </span>
                              {entry.isSampleConfidence ? (
                                <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded font-normal">
                                  sample
                                </span>
                              ) : (
                                <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 rounded font-bold">
                                  custom
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Mamdani Centroid Stress Score */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <span className={`font-mono font-black text-sm ${
                                isHighStress ? 'text-rose-600' : isMedStress ? 'text-amber-600' : 'text-emerald-700'
                              }`}>
                                {stress}
                              </span>
                              <span className="text-[10px] text-slate-400">/100</span>
                            </div>
                          </td>

                          {/* Interpretation Pill */}
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isHighStress
                                ? 'bg-rose-50 border-rose-200 text-rose-800'
                                : isMedStress
                                ? 'bg-amber-50 border-amber-200 text-amber-800'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            }`}>
                              {entry.assessment.interpretation.categoryShort} Workload
                            </span>
                          </td>

                          {/* Action Button: Trace Math */}
                          <td className="py-3 px-2 text-right">
                            <button
                              onClick={() => {
                                setInspectCourseId(courseObj?.id || entry.courseCode);
                                setActiveTab('visualizer');
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#2563EB] hover:bg-blue-50 transition-colors inline-flex items-center gap-1"
                            >
                              <span>Math Trace</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Aggregation Method Note */}
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong>Semester Aggregation Method:</strong> {fuzzyAssessment.aggregationMethodDoc}
              </span>
            </div>
          </div>

          {/* Life Balance Budget & Multi-Semester Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 168-Hour Life Balance */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-[#17365D]">
                Weekly 168-Hour Lifestyle Equilibrium
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Weekly Academic Commitment:</span>
                  <strong className="text-[#2563EB] font-bold">{weeklyStudyHours} hrs ({Math.round((weeklyStudyHours / 168) * 100)}%)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Rest & Sleep (8h / day):</span>
                  <strong className="text-slate-700">{sleepHours} hrs (33%)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Personal Care, Meals, Commute:</span>
                  <strong className="text-slate-700">{personalHours} hrs (17%)</strong>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-bold">
                  <span className="text-slate-700">Remaining Free / Social Time:</span>
                  <span className={remainingFreeHours < 20 ? 'text-rose-600' : 'text-emerald-700'}>
                    {remainingFreeHours} hrs / week
                  </span>
                </div>
              </div>

              {/* Stacked bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
                <div className="bg-[#2563EB]" style={{ width: `${(weeklyStudyHours / 168) * 100}%` }} title="Academics" />
                <div className="bg-indigo-300" style={{ width: `${(sleepHours / 168) * 100}%` }} title="Sleep" />
                <div className="bg-slate-400" style={{ width: `${(personalHours / 168) * 100}%` }} title="Personal" />
                <div className="bg-emerald-400" style={{ width: `${(remainingFreeHours / 168) * 100}%` }} title="Free time" />
              </div>
            </div>

            {/* Advisory Recommendations */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-[#17365D] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#F4C95D]" />
                Fuzzy Workload Advisory Insights
              </h3>

              {fuzzyAssessment.advisoryRecommendations.length === 0 ? (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Optimal schedule balance detected. Course rigor, credit units, and student confidence are in harmony.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {fuzzyAssessment.advisoryRecommendations.map((rec, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-[#2563EB] shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MAMDANI INFERENCE VISUALIZER */}
      {/* ========================================================================= */}
      {activeTab === 'visualizer' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Course Selection Strip for Visualizer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-700 shrink-0">
                Inspect Course:
              </span>
              <div className="w-full sm:w-80 min-w-0">
                <CustomSelect
                  value={activeInspectCourse?.id || ''}
                  onChange={setInspectCourseId}
                  options={inspectCourseOptions}
                  placeholder="Select course to inspect..."
                  size="sm"
                  className="rounded-xl border-slate-300"
                />
              </div>
            </div>

            {activeInspectCourse && (
              <button
                onClick={() => setConfidenceModalCourse(activeInspectCourse)}
                className="w-full sm:w-auto px-3 py-2 rounded-lg text-xs font-bold bg-[#17365D] hover:bg-[#2563EB] text-white transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <Sliders className="w-3.5 h-3.5 text-[#F4C95D]" />
                <span>Adjust Confidence for {activeInspectCourse.code}</span>
              </button>
            )}
          </div>

          {activeInspectAssessment ? (
            <MamdaniInferenceVisualizer 
              assessment={activeInspectAssessment}
              courseTitle={`${activeInspectCourse?.code}: ${activeInspectCourse?.title}`}
            />
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select a course in this semester to inspect its Mamdani fuzzy inference steps.
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: UNIT DIAGNOSTIC TESTS & SANDBOX */}
      {/* ========================================================================= */}
      {activeTab === 'tests' && (
        <div className="animate-in fade-in duration-200">
          <MamdaniTestSuitePanel />
        </div>
      )}

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
