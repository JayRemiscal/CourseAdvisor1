import React, { useState, useMemo } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Sliders, 
  Calculator, 
  Sparkles, 
  AlertTriangle,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  runMamdaniDiagnosticTests, 
  evaluateMamdaniFIS, 
  TestCaseResult,
  MamdaniWorkloadAssessment
} from '../../utils/fuzzyInferenceEngine';
import { FuzzyWorkloadGauge } from './FuzzyWorkloadGauge';
import { MamdaniInferenceVisualizer } from './MamdaniInferenceVisualizer';

export const MamdaniTestSuitePanel: React.FC = () => {
  const [testResults, setTestResults] = useState<TestCaseResult[]>(() => runMamdaniDiagnosticTests());
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string>(testResults[0]?.id || '');
  
  // Custom Interactive Sandbox state
  const [customConfidence, setCustomConfidence] = useState<number>(6.5);
  const [customDifficulty, setCustomDifficulty] = useState<number>(7.0);

  const customAssessment: MamdaniWorkloadAssessment = useMemo(() => {
    return evaluateMamdaniFIS(customConfidence, customDifficulty);
  }, [customConfidence, customDifficulty]);

  const handleRerunTests = () => {
    const fresh = runMamdaniDiagnosticTests();
    setTestResults(fresh);
  };

  const selectedTest = testResults.find(t => t.id === selectedTestCaseId) || testResults[0];
  const selectedTestAssessment = useMemo(() => {
    if (!selectedTest) return null;
    return evaluateMamdaniFIS(selectedTest.confidence, selectedTest.difficulty);
  }, [selectedTest]);

  const allPassed = testResults.every(t => t.passed);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#17365D] text-white">
              Deterministic Verification Harness
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              allPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {allPassed ? 'All 7 Engine Tests Passing ✓' : 'Verification Issues Detected'}
            </span>
          </div>
          <h3 className="text-xl font-black text-[#17365D]">
            Mamdani Engine Unit Test Suite & Live Sandbox
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tests boundary conditions, multi-membership overlaps, division-by-zero safeguards, and rule implications.
          </p>
        </div>

        <button
          onClick={handleRerunTests}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors flex items-center gap-1.5 shadow-2xs self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Re-run All 7 Unit Tests</span>
        </button>
      </div>

      {/* Tests Overview Table & Selected Test Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Test Case List (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
            <span>Mandatory Test Scenarios</span>
            <span className="text-[10px] text-slate-400">Click to inspect math</span>
          </div>

          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {testResults.map(test => {
              const isSelected = test.id === selectedTestCaseId;
              return (
                <div
                  key={test.id}
                  onClick={() => setSelectedTestCaseId(test.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#2563EB] bg-blue-50/70 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-800 line-clamp-1">
                      {test.name}
                    </span>
                    {test.passed ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px] shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Pass
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold flex items-center gap-1 text-[11px] shrink-0">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Fail
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      C={test.confidence} · D={test.difficulty}
                    </span>
                    <span className="font-mono font-bold text-slate-700">
                      Score: {test.actualScore}/100 ({test.actualCategory})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Test Math Details & Visualizer (7 cols) */}
        <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-4">
          {selectedTest && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Selected Test Case
                  </span>
                  <h4 className="font-extrabold text-sm text-[#17365D]">
                    {selectedTest.name}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-extrabold text-[#2563EB]">
                    Score: {selectedTest.actualScore}/100
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {selectedTest.actualCategory}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                <div className="font-semibold text-slate-700">Expected Result:</div>
                <p className="text-slate-600 text-[11px]">{selectedTest.expectedBehavior}</p>
                <div className="pt-1 text-[11px] text-[#2563EB] font-mono">
                  {selectedTest.details}
                </div>
              </div>

              {selectedTestAssessment && (
                <div className="pt-2">
                  <MamdaniInferenceVisualizer 
                    assessment={selectedTestAssessment}
                    courseTitle={selectedTest.name}
                  />
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Interactive Mamdani Sandbox */}
      <div className="pt-5 border-t border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#2563EB]" />
            <h4 className="font-bold text-sm text-[#17365D]">
              Interactive Input Sandbox (Test Any Confidence & Difficulty)
            </h4>
          </div>
          <span className="text-xs font-semibold text-slate-500">Live Deterministic Recalculation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
          
          {/* Slider 1: Confidence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-700">Student Confidence</label>
              <span className="font-mono font-extrabold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {customConfidence.toFixed(1)} / 10
              </span>
            </div>
            <input
              type="range"
              min={1.0}
              max={10.0}
              step={0.1}
              value={customConfidence}
              onChange={e => setCustomConfidence(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1.0 (Low)</span>
              <span>5.5 (Medium)</span>
              <span>10.0 (High)</span>
            </div>
          </div>

          {/* Slider 2: Difficulty */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-700">Course Difficulty</label>
              <span className="font-mono font-extrabold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {customDifficulty.toFixed(1)} / 10
              </span>
            </div>
            <input
              type="range"
              min={1.0}
              max={10.0}
              step={0.1}
              value={customDifficulty}
              onChange={e => setCustomDifficulty(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1.0 (Intro)</span>
              <span>5.5 (Standard)</span>
              <span>10.0 (Rigorous)</span>
            </div>
          </div>

          {/* Result Gauge */}
          <div className="flex items-center justify-center bg-white p-3 rounded-xl border border-slate-200">
            <FuzzyWorkloadGauge
              score={customAssessment.defuzzification.crispScore}
              category={customAssessment.interpretation.category}
              subtitle="Mamdani Centroid Output"
              size="sm"
            />
          </div>

        </div>

        {/* Live Visualizer for Custom Inputs */}
        <MamdaniInferenceVisualizer 
          assessment={customAssessment}
          courseTitle={`Sandbox Simulation (Confidence: ${customConfidence.toFixed(1)}, Difficulty: ${customDifficulty.toFixed(1)})`}
        />
      </div>

    </div>
  );
};
