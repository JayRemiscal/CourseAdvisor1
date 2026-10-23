import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  Sparkles, 
  RotateCcw, 
  Check, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { Course } from '../../types/academic';
import { evaluateMamdaniFIS } from '../../utils/fuzzyInferenceEngine';
import { FuzzyWorkloadGauge } from './FuzzyWorkloadGauge';

interface CourseConfidenceModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
}

export const CourseConfidenceModal: React.FC<CourseConfidenceModalProps> = ({
  course,
  isOpen,
  onClose,
}) => {
  const { 
    getCourseConfidence, 
    setCourseConfidence, 
    resetCourseConfidence 
  } = useAcademic();

  const currentConf = getCourseConfidence(course.code);
  const [sliderValue, setSliderValue] = useState<number>(currentConf.value);

  if (!isOpen) return null;

  const difficultyRating = course.difficultyRating || (course.difficulty ? course.difficulty * 2 : 5);
  const liveAssessment = evaluateMamdaniFIS(sliderValue, difficultyRating);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCourseConfidence(course.code, sliderValue);
    onClose();
  };

  const handleReset = () => {
    resetCourseConfidence(course.code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#17365D] text-white p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4C95D] text-[#17365D]">
                Student Self-Assessment
              </span>
              <span className="text-white/60 text-xs font-mono">{course.code}</span>
            </div>
            <h3 className="font-extrabold text-base text-white line-clamp-1">
              {course.title}
            </h3>
            <p className="text-[11px] text-blue-100/80 mt-0.5">
              Adjust your personal confidence rating for this course (1 to 10 scale).
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
          
          {/* Course Details Info */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Credit Units</span>
              <strong className="text-slate-800 font-bold">{course.credits} Units</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">Course Rigor (Difficulty)</span>
              <strong className="text-slate-800 font-bold font-mono">
                {difficultyRating} / 10
              </strong>
            </div>
          </div>

          {/* Interactive Confidence Slider */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-xs">
                Your Confidence Rating
              </label>
              <div className="flex items-center gap-2">
                {currentConf.isSample && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                    Sample Default
                  </span>
                )}
                <span className="font-mono font-extrabold text-xs text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {sliderValue.toFixed(1)} / 10
                </span>
              </div>
            </div>

            <input
              type="range"
              min={1.0}
              max={10.0}
              step={0.5}
              value={sliderValue}
              onChange={e => setSliderValue(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>1.0 (Low Familiarity)</span>
              <span>5.5 (Moderate)</span>
              <span>10.0 (High Mastery)</span>
            </div>
          </div>

          {/* Real-Time Live Mamdani Calculation Result */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Calculated Stress Index
              </span>
              <div className="font-mono text-xl font-black text-[#17365D]">
                {liveAssessment.defuzzification.crispScore} <span className="text-xs text-slate-400 font-normal">/100</span>
              </div>
              <span className="text-[10px] text-slate-600 block">
                {liveAssessment.interpretation.category}
              </span>
            </div>

            <FuzzyWorkloadGauge
              score={liveAssessment.defuzzification.crispScore}
              category={liveAssessment.interpretation.category}
              size="sm"
              showScore={false}
            />
          </div>

          {/* Notice */}
          <div className="text-[11px] text-slate-500 bg-blue-50/60 p-2.5 rounded-lg border border-blue-200/60 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Higher confidence reduces estimated study strain, while lower confidence signals a need for extra preparation time.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Sample</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors"
              >
                Save Rating
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
