import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  GitFork, 
  Activity, 
  HelpCircle, 
  Calculator, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { 
  MamdaniWorkloadAssessment, 
  CONFIDENCE_MF_PARAMS, 
  DIFFICULTY_MF_PARAMS, 
  STRESS_MF_PARAMS,
  fuzzifyConfidence,
  fuzzifyDifficulty,
  aggregateRuleOutputs
} from '../../utils/fuzzyInferenceEngine';

interface MamdaniInferenceVisualizerProps {
  assessment: MamdaniWorkloadAssessment;
  courseTitle?: string;
}

export const MamdaniInferenceVisualizer: React.FC<MamdaniInferenceVisualizerProps> = ({
  assessment,
  courseTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'fuzz' | 'rules' | 'defuzz'>('all');

  const { inputs, fuzzification, firedRules, defuzzification, interpretation } = assessment;

  // Active rules that actually fired
  const activeFiredRules = firedRules.filter(r => r.firingStrength > 0.001);

  // SVG dimensions for plots
  const plotWidth = 320;
  const plotHeight = 110;
  const padding = 20;

  // Coordinate mapping for [1, 10] -> [padding, plotWidth - padding]
  const mapXInput = (val: number) => {
    return padding + ((val - 1) / (10 - 1)) * (plotWidth - 2 * padding);
  };

  // Coordinate mapping for [0, 100] -> [padding, plotWidth - padding]
  const mapXOutput = (val: number) => {
    return padding + (val / 100) * (plotWidth - 2 * padding);
  };

  // Coordinate mapping for membership mu in [0, 1] -> [plotHeight - padding, padding]
  const mapY = (mu: number) => {
    return (plotHeight - padding) - mu * (plotHeight - 2 * padding);
  };

  // Generate SVG path for trapezoid [a, b, c, d] on [1, 10]
  const getTrapezoidPathInput = (a: number, b: number, c: number, d: number) => {
    const p1 = `${mapXInput(a)},${mapY(0)}`;
    const p2 = `${mapXInput(b)},${mapY(1)}`;
    const p3 = `${mapXInput(c)},${mapY(1)}`;
    const p4 = `${mapXInput(d)},${mapY(0)}`;
    return `M ${p1} L ${p2} L ${p3} L ${p4}`;
  };

  // Generate SVG path for triangle [a, b, c] on [1, 10]
  const getTrianglePathInput = (a: number, b: number, c: number) => {
    const p1 = `${mapXInput(a)},${mapY(0)}`;
    const p2 = `${mapXInput(b)},${mapY(1)}`;
    const p3 = `${mapXInput(c)},${mapY(0)}`;
    return `M ${p1} L ${p2} L ${p3}`;
  };

  // Generate SVG path for aggregated output surface
  const getAggregatedSurfacePath = () => {
    const points = aggregateRuleOutputs(firedRules).points;
    if (points.length === 0) return '';
    let d = `M ${mapXOutput(points[0].x)},${mapY(points[0].mu)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${mapXOutput(points[i].x)},${mapY(points[i].mu)}`;
    }
    // close along bottom
    d += ` L ${mapXOutput(100)},${mapY(0)} L ${mapXOutput(0)},${mapY(0)} Z`;
    return d;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-5 text-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-[#2563EB]">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#17365D]">
              Mamdani Fuzzy Inference Trace & Math Explainer
            </h4>
            <p className="text-[11px] text-slate-500">
              {courseTitle ? `Evaluating: ${courseTitle}` : 'Interactive step-by-step mathematical verification'}
            </p>
          </div>
        </div>

        {/* View mode toggle tabs */}
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold">
          {(['all', 'fuzz', 'rules', 'defuzz'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-white text-[#17365D] font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'all' ? 'All Steps' : tab === 'fuzz' ? '1. Fuzzify' : tab === 'rules' ? '2. Rules' : '3. Defuzzify'}
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: FUZZIFICATION */}
      {(activeTab === 'all' || activeTab === 'fuzz') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#17365D] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#17365D] text-white flex items-center justify-center text-[10px]">1</span>
              Fuzzification (Input Membership Functions)
            </span>
            <span className="text-[10px] text-slate-400">Triangular & Trapezoidal curves</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Input 1: Student Confidence */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Input 1: Confidence ({inputs.confidence}/10)</span>
                {inputs.isSampleConfidence && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                    Sample Default
                  </span>
                )}
              </div>

              {/* Confidence Plot */}
              <div className="bg-white rounded-lg p-2 border border-slate-200/80 flex justify-center">
                <svg viewBox={`0 0 ${plotWidth} ${plotHeight}`} className="w-full max-w-[320px] h-auto overflow-visible">
                  {/* Grid base line */}
                  <line x1={padding} y1={mapY(0)} x2={plotWidth - padding} y2={mapY(0)} stroke="#CBD5E1" strokeWidth={1} />
                  
                  {/* Low Curve */}
                  <path d={getTrapezoidPathInput(CONFIDENCE_MF_PARAMS.low.a, CONFIDENCE_MF_PARAMS.low.b, CONFIDENCE_MF_PARAMS.low.c, CONFIDENCE_MF_PARAMS.low.d)} fill="none" stroke="#F43F5E" strokeWidth={2} />
                  
                  {/* Medium Curve */}
                  <path d={getTrianglePathInput(CONFIDENCE_MF_PARAMS.medium.a, CONFIDENCE_MF_PARAMS.medium.b, CONFIDENCE_MF_PARAMS.medium.c)} fill="none" stroke="#F59E0B" strokeWidth={2} />
                  
                  {/* High Curve */}
                  <path d={getTrapezoidPathInput(CONFIDENCE_MF_PARAMS.high.a, CONFIDENCE_MF_PARAMS.high.b, CONFIDENCE_MF_PARAMS.high.c, CONFIDENCE_MF_PARAMS.high.d)} fill="none" stroke="#10B981" strokeWidth={2} />

                  {/* Crisp Input Line */}
                  <line 
                    x1={mapXInput(inputs.confidence)} 
                    y1={mapY(0)} 
                    x2={mapXInput(inputs.confidence)} 
                    y2={mapY(1)} 
                    stroke="#2563EB" 
                    strokeWidth={2} 
                    strokeDasharray="4 2" 
                  />
                  <circle cx={mapXInput(inputs.confidence)} cy={mapY(0)} r={3} fill="#2563EB" />
                </svg>
              </div>

              {/* Degrees */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-rose-700 font-semibold">Low: {fuzzification.confidence.memberships.low.toFixed(2)}</span>
                <span className="text-amber-700 font-semibold">Medium: {fuzzification.confidence.memberships.medium.toFixed(2)}</span>
                <span className="text-emerald-700 font-semibold">High: {fuzzification.confidence.memberships.high.toFixed(2)}</span>
              </div>
            </div>

            {/* Input 2: Course Difficulty */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Input 2: Difficulty ({inputs.difficulty}/10)</span>
                <span className="text-[10px] text-slate-400">Curriculum Syllabus Rating</span>
              </div>

              {/* Difficulty Plot */}
              <div className="bg-white rounded-lg p-2 border border-slate-200/80 flex justify-center">
                <svg viewBox={`0 0 ${plotWidth} ${plotHeight}`} className="w-full max-w-[320px] h-auto overflow-visible">
                  <line x1={padding} y1={mapY(0)} x2={plotWidth - padding} y2={mapY(0)} stroke="#CBD5E1" strokeWidth={1} />
                  <path d={getTrapezoidPathInput(DIFFICULTY_MF_PARAMS.low.a, DIFFICULTY_MF_PARAMS.low.b, DIFFICULTY_MF_PARAMS.low.c, DIFFICULTY_MF_PARAMS.low.d)} fill="none" stroke="#10B981" strokeWidth={2} />
                  <path d={getTrianglePathInput(DIFFICULTY_MF_PARAMS.medium.a, DIFFICULTY_MF_PARAMS.medium.b, DIFFICULTY_MF_PARAMS.medium.c)} fill="none" stroke="#F59E0B" strokeWidth={2} />
                  <path d={getTrapezoidPathInput(DIFFICULTY_MF_PARAMS.high.a, DIFFICULTY_MF_PARAMS.high.b, DIFFICULTY_MF_PARAMS.high.c, DIFFICULTY_MF_PARAMS.high.d)} fill="none" stroke="#F43F5E" strokeWidth={2} />

                  {/* Crisp Input Line */}
                  <line 
                    x1={mapXInput(inputs.difficulty)} 
                    y1={mapY(0)} 
                    x2={mapXInput(inputs.difficulty)} 
                    y2={mapY(1)} 
                    stroke="#2563EB" 
                    strokeWidth={2} 
                    strokeDasharray="4 2" 
                  />
                  <circle cx={mapXInput(inputs.difficulty)} cy={mapY(0)} r={3} fill="#2563EB" />
                </svg>
              </div>

              {/* Degrees */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-emerald-700 font-semibold">Low: {fuzzification.difficulty.memberships.low.toFixed(2)}</span>
                <span className="text-amber-700 font-semibold">Medium: {fuzzification.difficulty.memberships.medium.toFixed(2)}</span>
                <span className="text-rose-700 font-semibold">High: {fuzzification.difficulty.memberships.high.toFixed(2)}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* STEP 2: RULE EVALUATION (MAMDANI MIN OPERATOR) */}
      {(activeTab === 'all' || activeTab === 'rules') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#17365D] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#17365D] text-white flex items-center justify-center text-[10px]">2</span>
              Rule Evaluation (Mamdani Min Operator for AND)
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              {activeFiredRules.length} Rule(s) Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {firedRules.map(r => {
              const isActive = r.firingStrength > 0.001;
              return (
                <div
                  key={r.ruleId}
                  className={`p-2.5 rounded-xl border transition-all text-xs ${
                    isActive
                      ? 'bg-blue-50/80 border-[#2563EB] shadow-2xs'
                      : 'bg-slate-50/50 border-slate-200/60 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[10px] text-slate-500">
                      Rule #{r.ruleId}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] ${
                      isActive ? 'bg-[#2563EB] text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      &alpha; = {r.firingStrength.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-slate-800 leading-tight">
                    {r.ruleText}
                  </p>

                  <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Consequent: <strong>{r.consequent} Stress</strong></span>
                    {isActive && <span className="text-emerald-700 font-bold">Fired ✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3 & 4: AGGREGATION & DEFUZZIFICATION */}
      {(activeTab === 'all' || activeTab === 'defuzz') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#17365D] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#17365D] text-white flex items-center justify-center text-[10px]">3 & 4</span>
              Aggregation (Max) & Centroid Defuzzification (COG)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              y* = &sum;(x &middot; &mu;) / &sum;&mu;
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Aggregated Output Surface Plot */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                Aggregated Output Fuzzy Region (&mu;<sub>agg</sub>)
              </span>

              <div className="bg-white rounded-lg p-2 border border-slate-200/80 flex justify-center">
                <svg viewBox={`0 0 ${plotWidth} ${plotHeight}`} className="w-full max-w-[320px] h-auto overflow-visible">
                  <line x1={padding} y1={mapY(0)} x2={plotWidth - padding} y2={mapY(0)} stroke="#CBD5E1" strokeWidth={1} />
                  
                  {/* Aggregated Surface Fill */}
                  <path d={getAggregatedSurfacePath()} fill="#3B82F6" fillOpacity={0.25} stroke="#2563EB" strokeWidth={2} />

                  {/* Centroid Vertical Line */}
                  {!defuzzification.hasCalculationError && (
                    <>
                      <line 
                        x1={mapXOutput(defuzzification.crispScore)} 
                        y1={mapY(0)} 
                        x2={mapXOutput(defuzzification.crispScore)} 
                        y2={mapY(1)} 
                        stroke="#E11D48" 
                        strokeWidth={2.5} 
                        strokeDasharray="3 2" 
                      />
                      <circle cx={mapXOutput(defuzzification.crispScore)} cy={mapY(0)} r={4} fill="#E11D48" />
                    </>
                  )}
                </svg>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>0 (Min Stress)</span>
                <span className="text-rose-600 font-bold">Centroid: {defuzzification.crispScore}/100</span>
                <span>100 (Max Stress)</span>
              </div>
            </div>

            {/* Centroid Formula Execution Breakdown */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <span className="text-xs font-bold text-[#17365D] block">
                Deterministic Mathematical Result
              </span>

              <div className="p-3 rounded-lg bg-slate-50 font-mono text-[11px] space-y-1.5 border border-slate-200/70">
                <div className="flex justify-between">
                  <span className="text-slate-500">Numerator &sum;(x &middot; &mu;):</span>
                  <strong className="text-slate-800">{defuzzification.numerator}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Denominator &sum;&mu;:</span>
                  <strong className="text-slate-800">{defuzzification.denominator}</strong>
                </div>
                <div className="pt-1 border-t border-slate-200 flex justify-between font-bold text-xs text-[#2563EB]">
                  <span>Crisp Centroid Score:</span>
                  <span>{defuzzification.crispScore} / 100</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 space-y-1">
                <div>
                  Category: <strong className="text-slate-900">{interpretation.category}</strong>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  {interpretation.summary}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
