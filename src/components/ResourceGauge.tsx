import React from 'react';

interface ResourceGaugeProps {
  label: string; // 'CPU' | 'Memory' | 'Disk'
  percent: number; // 0 - 100
  valueText: string; // e.g. "52.8%" or "2.6 / 4 GB"
  subText?: string; // e.g. "4 cores", "cgroup-v2"
  size?: 'sm' | 'md' | 'lg';
  showArc?: boolean;
}

export const ResourceGauge: React.FC<ResourceGaugeProps> = ({
  label,
  percent,
  valueText,
  subText,
  size = 'md',
  showArc = true,
}) => {
  const safePercent = Math.min(100, Math.max(0, percent));

  // Determine color scheme based on thresholds
  let strokeColor = '#10b981'; // emerald-500
  let textColor = 'text-emerald-400';
  let bgColor = 'bg-emerald-500/10';
  let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  if (safePercent >= 90) {
    strokeColor = '#f43f5e'; // rose-500
    textColor = 'text-rose-400';
    bgColor = 'bg-rose-500/10';
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse';
  } else if (safePercent >= 75) {
    strokeColor = '#f59e0b'; // amber-500
    textColor = 'text-amber-400';
    bgColor = 'bg-amber-500/10';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  }

  // SVG circular arc parameters
  const radius = size === 'sm' ? 24 : size === 'lg' ? 38 : 30;
  const strokeWidth = size === 'sm' ? 4 : 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safePercent / 100) * circumference;
  const svgSize = (radius + strokeWidth) * 2;

  return (
    <div className={`flex flex-col items-center justify-center p-2 rounded-lg border border-slate-700/60 bg-slate-900/70 shadow-inner ${bgColor} transition-colors duration-300`}>
      <div className="w-full flex items-center justify-between gap-1 mb-1 px-1">
        <span className="text-[10px] font-semibold tracking-wider text-slate-300 uppercase">
          {label}
        </span>
        <span className={`text-[10px] font-mono px-1 rounded border ${badgeColor}`}>
          {Math.round(safePercent)}%
        </span>
      </div>

      {showArc ? (
        <div className="relative flex items-center justify-center my-0.5">
          <svg width={svgSize} height={svgSize} className="-rotate-90">
            {/* Background track circle */}
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              stroke="#334155"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Animated value arc */}
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-[12px] font-bold font-mono tracking-tight ${textColor}`}>
              {Math.round(safePercent)}%
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full bg-slate-800 rounded-full h-2 my-1 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${safePercent}%`, backgroundColor: strokeColor }}
          />
        </div>
      )}

      <div className="text-[10px] text-slate-400 font-mono text-center truncate max-w-[90px] mt-0.5" title={valueText}>
        {valueText}
      </div>
      {subText && (
        <div className="text-[9px] text-slate-300 truncate max-w-[90px] text-center">
          {subText}
        </div>
      )}
    </div>
  );
};
