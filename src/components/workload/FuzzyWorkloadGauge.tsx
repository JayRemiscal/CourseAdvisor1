import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface FuzzyWorkloadGaugeProps {
  score: number; // 0 to 100
  category: 'Low' | 'Moderate' | 'High' | 'Low Workload Stress' | 'Moderate Workload Stress' | 'High Workload Stress';
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
}

export const FuzzyWorkloadGauge: React.FC<FuzzyWorkloadGaugeProps> = ({
  score,
  category,
  subtitle,
  size = 'md',
  showScore = true,
}) => {
  const boundedScore = Math.max(0, Math.min(100, Math.round(score * 10) / 10));

  // Determine normalized angle for semicircular gauge:
  // 0 -> -90 deg (left), 50 -> 0 deg (top), 100 -> 90 deg (right)
  const angle = -90 + (boundedScore / 100) * 180;

  // Determine colors based on standard stress thresholds:
  // Low <= 35 (emerald), Moderate <= 65 (amber), High > 65 (rose)
  const isHigh = boundedScore > 65;
  const isModerate = boundedScore > 35 && boundedScore <= 65;

  const badgeBg = isHigh
    ? 'bg-rose-50 border-rose-200 text-rose-800'
    : isModerate
    ? 'bg-amber-50 border-amber-200 text-amber-800'
    : 'bg-emerald-50 border-emerald-200 text-emerald-800';
  const categoryLabel = category.includes('Low')
    ? 'Low Workload'
    : category.includes('High')
    ? 'High Workload'
    : 'Moderate Workload';

  const radius = size === 'sm' ? 48 : size === 'lg' ? 84 : 68;
  const strokeWidth = size === 'sm' ? 10 : size === 'lg' ? 16 : 13;
  const width = size === 'sm' ? 128 : size === 'lg' ? 220 : 180;
  const height = size === 'sm' ? 68 : size === 'lg' ? 116 : 95;
  const cx = width / 2;
  const cy = height - (size === 'sm' ? 8 : 11);

  // Circumference of semicircle: pi * r
  const arcLength = Math.PI * radius;
  // Dash offset: fraction filled
  const dashOffset = arcLength * (1 - boundedScore / 100);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id="gaugeTrackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#F43F5E" />
            </linearGradient>
          </defs>

          {/* Background track (semicircle) */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active value track */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#gaugeTrackGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Needle pointer (rendered behind pivot hub) */}
          <g transform={`rotate(${angle} ${cx} ${cy})`} className="transition-transform duration-700 ease-out">
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - radius + (strokeWidth / 2) + 2}
              stroke="#0F172A"
              strokeWidth={size === 'sm' ? 2.5 : 3.5}
              strokeLinecap="round"
            />
          </g>

          {/* Needle pivot hub */}
          <circle
            cx={cx}
            cy={cy}
            r={size === 'sm' ? 5 : 7}
            fill="#0F172A"
            stroke="#FFFFFF"
            strokeWidth={2}
          />
          <circle
            cx={cx}
            cy={cy}
            r={size === 'sm' ? 2 : 2.5}
            fill="#94A3B8"
          />
        </svg>
      </div>

      {/* Crisp numerical score readout placed cleanly below the dial */}
      {showScore && (
        <div className="mt-1 flex items-baseline justify-center gap-1">
          <span className={`font-mono font-black ${size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-3xl'} text-[#17365D] tracking-tight leading-none`}>
            {boundedScore}
          </span>
          <span className="text-xs font-bold text-slate-400">/100</span>
        </div>
      )}

      {/* Category interpretation pill */}
      <div className={`${showScore ? 'mt-1.5' : 'mt-2'} flex flex-col items-center gap-1`}>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border flex items-center gap-1.5 shadow-2xs ${badgeBg}`}>
          {isHigh ? (
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          ) : isModerate ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          )}
          <span>{categoryLabel}</span>
        </span>

        {subtitle && (
          <span className="text-[10px] text-slate-500 max-w-[200px] leading-tight">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
