import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  Calendar, 
  Info, 
  ChevronRight, 
  ChevronDown,
  RefreshCw, 
  Brain, 
  CheckCircle2, 
  LineChart as LineChartIcon,
  HelpCircle,
  Stethoscope,
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  FileText
} from "lucide-react";
import { HealthTrajectoryReport, BiomarkerTrajectory } from "../types";

interface Props {
  patientId: string;
  patientName: string;
  role?: "patient" | "doctor";
}

// Precision formatting helpers to eliminate raw floating point artifacts
const formatNumber = (num?: number, decimals: number = 1): string => {
  if (num === undefined || num === null || isNaN(num)) return "—";
  if (Number.isInteger(num)) return num.toString();
  return Number(num.toFixed(decimals)).toString();
};

const formatVelocity = (vel?: number, decimals: number = 2): string => {
  if (vel === undefined || vel === null || isNaN(vel)) return "0.0";
  const sign = vel > 0 ? "+" : "";
  return `${sign}${Number(vel.toFixed(decimals))}`;
};

const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const formatShortDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
};

export const HealthTrajectoryCard: React.FC<Props> = ({ patientId, patientName, role = "patient" }) => {
  const [report, setReport] = useState<HealthTrajectoryReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarkerKey, setSelectedMarkerKey] = useState<string>("hba1c");
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    type: "observed" | "forecast";
    date: string;
    value: number;
    unit: string;
    range?: [number, number];
    source?: string;
    daysAhead?: number;
  } | null>(null);

  const fetchTrajectory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/ml/trajectory/${patientId}`);
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        if (data.report.trajectories && data.report.trajectories.length > 0) {
          // Keep current selection if valid, otherwise pick first available
          if (!data.report.trajectories.some((t: BiomarkerTrajectory) => t.markerKey === selectedMarkerKey)) {
            setSelectedMarkerKey(data.report.trajectories[0].markerKey);
          }
        }
      } else {
        setError(data.error || "Failed to load trajectory forecast.");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading trajectory forecast.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrajectory();
  }, [patientId]);

  if (loading) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
            <Activity className="w-5 h-5 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Generating AI Health Forecast...</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Analyzing verified blood lab records and modeling mathematical trajectories across historical observations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report || !report.trajectories || report.trajectories.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl">
            <Info className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-base text-slate-900 dark:text-slate-100">
              Need More Health Records for Forecasting
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Longitudinal forecasting requires at least one verified laboratory report or clinical encounter with vitals on file for {patientName}.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button 
                onClick={fetchTrajectory}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Check for New Records
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedTrajectory = report.trajectories.find(t => t.markerKey === selectedMarkerKey) || report.trajectories[0];
  const hasSufficientData = selectedTrajectory && selectedTrajectory.historicalReadings && selectedTrajectory.historicalReadings.length >= 2;

  // Helper to determine clinical status interpretation
  const getStatusDetails = (t: BiomarkerTrajectory) => {
    const val = t.currentValue;
    const target = t.clinicalTarget;
    const isRising = t.trendDirection === "RISING";
    const isFalling = t.trendDirection === "FALLING";

    let statusText = "Within Target Range";
    let statusColor = "emerald";
    let statusBadge = "Optimal";

    if (target.max && val > target.max) {
      const diff = val - target.max;
      if (diff > (target.max * 0.25)) {
        statusText = "Above Target Range";
        statusColor = "rose";
        statusBadge = "Elevated";
      } else {
        statusText = "Slightly Above Target";
        statusColor = "amber";
        statusBadge = "Moderate";
      }
    } else if (target.min && val < target.min) {
      statusText = "Below Target Range";
      statusColor = "amber";
      statusBadge = "Below Optimal";
    }

    let trendLabel = "Stable Baseline";
    if (t.historicalReadings && t.historicalReadings.length < 2) {
      trendLabel = "Single Baseline (Trend Pending)";
    } else if (isRising) {
      trendLabel = `Upward Trend (${formatVelocity(t.velocityPerMonth, 2)} ${t.unit}/mo)`;
    } else if (isFalling) {
      trendLabel = `Improving Trend (${formatVelocity(t.velocityPerMonth, 2)} ${t.unit}/mo)`;
    }

    return { statusText, statusColor, statusBadge, trendLabel };
  };

  const statusDetails = getStatusDetails(selectedTrajectory);

  // Responsive SVG Forecast Visualizer
  const renderForecastChart = (t: BiomarkerTrajectory) => {
    const historical = t.historicalReadings || [];
    const forecasts = t.allForecastPoints || [];

    if (historical.length < 2) {
      return (
        <div className="p-6 bg-slate-50/80 dark:bg-slate-950/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <LineChartIcon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200">Insufficient Longitudinal Data</h5>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              At least two temporal observations are required for mathematical velocity computation and trajectory projection.
            </p>
          </div>
          {historical.length === 1 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Baseline on file: <strong>{formatNumber(historical[0].value, 1)} {t.unit}</strong> ({formatDate(historical[0].date)})</span>
            </div>
          )}
        </div>
      );
    }

    const allValues = [
      ...historical.map(h => h.value),
      ...forecasts.map(f => f.value),
      ...forecasts.map(f => f.confidenceLow),
      ...forecasts.map(f => f.confidenceHigh)
    ];

    const rawMin = Math.min(...allValues);
    const rawMax = Math.max(...allValues);
    const rangeBuffer = Math.max(0.5, (rawMax - rawMin) * 0.18);
    const minY = Math.max(0, rawMin - rangeBuffer);
    const maxY = rawMax + rangeBuffer;
    const rangeY = Math.max(0.1, maxY - minY);

    const chartWidth = 620;
    const chartHeight = 220;
    const padding = { top: 32, right: 45, bottom: 42, left: 55 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const totalPoints = historical.length + forecasts.length;
    const getX = (index: number) => padding.left + (index / Math.max(1, totalPoints - 1)) * innerWidth;
    const getY = (val: number) => padding.top + innerHeight - ((val - minY) / rangeY) * innerHeight;

    // Historical Points
    const histPoints = historical.map((h, i) => ({
      x: getX(i),
      y: getY(h.value),
      data: h,
      label: formatShortDate(h.date)
    }));
    const histPath = histPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    // Forecast Points
    const forecastStartIndex = historical.length - 1;
    const forecastOnlyPoints = forecasts.map((f, i) => ({
      x: getX(forecastStartIndex + 1 + i),
      y: getY(f.value),
      lowY: getY(f.confidenceLow),
      highY: getY(f.confidenceHigh),
      data: f,
      label: `+${f.daysAhead}d`
    }));

    const forecastPoints = [
      {
        x: histPoints[histPoints.length - 1].x,
        y: histPoints[histPoints.length - 1].y,
        lowY: histPoints[histPoints.length - 1].y,
        highY: histPoints[histPoints.length - 1].y,
        data: histPoints[histPoints.length - 1].data as any,
        label: histPoints[histPoints.length - 1].label
      },
      ...forecastOnlyPoints
    ];
    const forecastPath = forecastPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    // 95% Confidence Corridor Polygon
    const upperBand = forecastOnlyPoints.map(p => `${p.x},${p.highY}`);
    const lowerBand = [...forecastOnlyPoints].reverse().map(p => `${p.x},${p.lowY}`);
    const corridorPolygon = [
      `${forecastPoints[0].x},${forecastPoints[0].y}`,
      ...upperBand,
      ...lowerBand
    ].join(" ");

    const latestPoint = histPoints[histPoints.length - 1];

    return (
      <div className="relative w-full overflow-hidden bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-3 sm:p-4">
        {/* Hover details pill */}
        <div className="h-6 mb-2 flex items-center justify-between text-xs px-2">
          {hoveredPoint ? (
            <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
              <span className={`w-2 h-2 rounded-full ${hoveredPoint.type === "observed" ? "bg-emerald-500" : "bg-indigo-600"}`} />
              <span>
                {hoveredPoint.type === "observed" ? "Verified Lab Record" : `Forecast (+${hoveredPoint.daysAhead} Days)`}:
              </span>
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {formatNumber(hoveredPoint.value, 1)} {hoveredPoint.unit}
              </span>
              <span className="text-slate-400">({formatDate(hoveredPoint.date)})</span>
              {hoveredPoint.range && (
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                  Range: [{formatNumber(hoveredPoint.range[0], 1)} – {formatNumber(hoveredPoint.range[1], 1)}]
                </span>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Hover over any data point on the curve to inspect verified dates & forecast ranges.</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Observed Records</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-indigo-600 border-dashed inline-block" />
              <span className="font-medium text-slate-700 dark:text-slate-300">AI Forecast</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-200/60 dark:bg-indigo-900/50 inline-block" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Expected Range</span>
            </span>
          </div>
        </div>

        {/* Responsive SVG */}
        <div className="w-full overflow-x-auto scrollbar-none">
          <svg 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
            className="w-full min-w-[500px] h-48 select-none"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id={`corridor-${t.markerKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.18" />
              </linearGradient>
              <linearGradient id={`histGrad-${t.markerKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle Grid lines */}
            <line x1={padding.left} y1={padding.top} x2={chartWidth - padding.right} y2={padding.top} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" className="dark:stroke-slate-800" />
            <line x1={padding.left} y1={padding.top + innerHeight / 2} x2={chartWidth - padding.right} y2={padding.top + innerHeight / 2} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" className="dark:stroke-slate-800" />
            <line x1={padding.left} y1={padding.top + innerHeight} x2={chartWidth - padding.right} y2={padding.top + innerHeight} stroke="#cbd5e1" strokeWidth="1" className="dark:stroke-slate-700" />

            {/* Y Axis Reference Labels */}
            <text x={padding.left - 10} y={padding.top + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">{formatNumber(maxY, 1)} {t.unit}</text>
            <text x={padding.left - 10} y={padding.top + innerHeight / 2 + 3} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">{formatNumber((minY + maxY) / 2, 1)}</text>
            <text x={padding.left - 10} y={padding.top + innerHeight} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">{formatNumber(minY, 1)}</text>

            {/* Forecast Uncertainty Corridor Band */}
            <polygon points={corridorPolygon} fill={`url(#corridor-${t.markerKey})`} />

            {/* Subtle corridor upper and lower boundary dashes */}
            {forecastOnlyPoints.map((p, idx) => (
              <React.Fragment key={`bound-${idx}`}>
                <circle cx={p.x} cy={p.highY} r="2" className="fill-indigo-300 dark:fill-indigo-700 opacity-60" />
                <circle cx={p.x} cy={p.lowY} r="2" className="fill-indigo-300 dark:fill-indigo-700 opacity-60" />
              </React.Fragment>
            ))}

            {/* Historical Area Under Curve */}
            {histPoints.length > 1 && (
              <polygon 
                points={`${histPoints[0].x},${padding.top + innerHeight} ${histPoints.map(p => `${p.x},${p.y}`).join(" ")} ${latestPoint.x},${padding.top + innerHeight}`}
                fill={`url(#histGrad-${t.markerKey})`}
              />
            )}

            {/* "Latest Lab / Today" Divider Line */}
            <line 
              x1={latestPoint.x} 
              y1={padding.top - 10} 
              x2={latestPoint.x} 
              y2={padding.top + innerHeight + 8} 
              stroke="#64748b" 
              strokeDasharray="4 4" 
              strokeWidth="1.5" 
              className="opacity-70"
            />

            {/* Latest Lab Badge Header */}
            <g transform={`translate(${latestPoint.x}, ${padding.top - 14})`}>
              <rect x="-32" y="-10" width="64" height="15" rx="7.5" className="fill-slate-800 dark:fill-slate-200" />
              <text x="0" y="1" textAnchor="middle" className="text-[8px] font-bold fill-white dark:fill-slate-900 uppercase tracking-wider">
                Latest Lab
              </text>
            </g>

            {/* Historical Line (Solid) */}
            <path d={histPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

            {/* Forecast Line (Dashed) */}
            <path d={forecastPath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="6 4" strokeLinecap="round" />

            {/* Historical Observation Points */}
            {histPoints.map((p, i) => {
              const isHovered = hoveredPoint?.date === p.data.date;
              return (
                <g 
                  key={`h-${i}`} 
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint({
                    type: "observed",
                    date: p.data.date,
                    value: p.data.value,
                    unit: t.unit,
                    source: p.data.source
                  })}
                >
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r={isHovered ? "6" : "4.5"} 
                    className="fill-white stroke-emerald-600 stroke-2 transition-all duration-150" 
                  />
                  <text x={p.x} y={padding.top + innerHeight + 18} textAnchor="middle" className="text-[9px] fill-slate-500 font-medium">
                    {p.label}
                  </text>
                  <text 
                    x={p.x} 
                    y={p.y - 9} 
                    textAnchor="middle" 
                    className="text-[10px] font-bold fill-slate-800 dark:fill-slate-100 font-mono"
                  >
                    {formatNumber(p.data.value, 1)}
                  </text>
                </g>
              );
            })}

            {/* Forecast Projection Points */}
            {forecastPoints.slice(1).map((p: any, i) => {
              const isHovered = hoveredPoint?.daysAhead === p.data.daysAhead;
              return (
                <g 
                  key={`f-${i}`} 
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint({
                    type: "forecast",
                    date: p.data.date,
                    value: p.data.value,
                    unit: t.unit,
                    range: [p.data.confidenceLow, p.data.confidenceHigh],
                    daysAhead: p.data.daysAhead
                  })}
                >
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r={isHovered ? "6" : "4.5"} 
                    className="fill-indigo-600 stroke-white stroke-2 transition-all duration-150" 
                  />
                  <text x={p.x} y={padding.top + innerHeight + 18} textAnchor="middle" className="text-[9px] font-bold fill-indigo-600 dark:fill-indigo-400">
                    +{p.data.daysAhead}d
                  </text>
                  <text 
                    x={p.x} 
                    y={p.y - 9} 
                    textAnchor="middle" 
                    className="text-[10px] font-bold fill-indigo-700 dark:fill-indigo-300 font-mono"
                  >
                    {formatNumber(p.data.value, 1)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Mobile Legend Footer */}
        <div className="flex sm:hidden flex-wrap items-center justify-center gap-3 pt-3 mt-1 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px]">
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Observed History
          </span>
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-0.5 border-t-2 border-indigo-600 border-dashed" /> AI Forecast
          </span>
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <span className="w-2 h-2 rounded bg-indigo-200 dark:bg-indigo-900/50" /> 95% Corridor
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 md:p-7 space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg md:text-xl text-slate-900 dark:text-white flex items-center gap-2">
                AI Health Forecast & 90-Day Trajectory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Longitudinal analysis showing where your key health vitals are heading based on verified lab records.
              </p>
            </div>
          </div>
        </div>

        {/* Calm Status Pill & Action */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-2.5">
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Health Trajectory</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 justify-end">
                {statusDetails.statusBadge}
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              </span>
            </div>
          </div>

          <button 
            onClick={fetchTrajectory} 
            title="Refresh Forecast"
            className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Biomarker Segmented Navigation Bar */}
      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
          Select Biomarker To Inspect
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {report.trajectories.map((t) => {
            const isSelected = t.markerKey === selectedMarkerKey;
            const obsCount = t.historicalReadings?.length || 0;
            const hasMultiPoint = obsCount >= 2;
            const isRising = hasMultiPoint && t.trendDirection === "RISING";
            const isFalling = hasMultiPoint && t.trendDirection === "FALLING";

            return (
              <button
                key={t.markerKey}
                onClick={() => setSelectedMarkerKey(t.markerKey)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs shadow-indigo-200 dark:shadow-none"
                    : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100"
                }`}
              >
                <span>{t.markerName.split("(")[0].trim()}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}>
                  {formatNumber(t.currentValue, 1)} {t.unit}
                </span>
                {!hasMultiPoint ? (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-sans uppercase ${isSelected ? "bg-white/20 text-white" : "text-slate-400"}`}>1 Obs</span>
                ) : isRising ? (
                  <ArrowUpRight className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-rose-500"}`} />
                ) : isFalling ? (
                  <ArrowDownRight className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-emerald-500"}`} />
                ) : (
                  <Minus className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Selected Biomarker Forecast Presentation */}
      {selectedTrajectory && (
        <div className="space-y-5">
          {/* 4 Apple-Health Style High-Level Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Current Observed Value */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Latest Observed</span>
                {selectedTrajectory.historicalReadings.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {formatShortDate(selectedTrajectory.historicalReadings[selectedTrajectory.historicalReadings.length - 1].date)}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                  {formatNumber(selectedTrajectory.currentValue, 1)}
                </span>
                <span className="text-xs font-semibold text-slate-500">{selectedTrajectory.unit}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
                <Target className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Target: {selectedTrajectory.clinicalTarget.optimal}</span>
              </div>
            </div>

            {/* 2. Rate of Change (Velocity) */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Pace</span>
              {hasSufficientData ? (
                <>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-2xl font-bold font-mono ${
                      selectedTrajectory.velocityPerMonth > 0 
                        ? "text-rose-600 dark:text-rose-400" 
                        : selectedTrajectory.velocityPerMonth < 0 
                        ? "text-emerald-600 dark:text-emerald-400" 
                        : "text-slate-700 dark:text-slate-300"
                    }`}>
                      {formatVelocity(selectedTrajectory.velocityPerMonth, 2)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{selectedTrajectory.unit}/mo</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-medium">{selectedTrajectory.trendDirection === "STABLE" ? "Steady baseline" : `${selectedTrajectory.trendDirection.toLowerCase()} trend`}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-slate-400 font-mono">Pending</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Needs ≥2 observations
                  </div>
                </>
              )}
            </div>

            {/* 3. 90-Day Projected Horizon */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">90-Day Forecast</span>
              {hasSufficientData ? (
                <>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-indigo-900 dark:text-indigo-200 font-mono">
                      {formatNumber(selectedTrajectory.forecast90Days.value, 1)}
                    </span>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{selectedTrajectory.unit}</span>
                  </div>
                  <div className="text-[11px] text-indigo-700/80 dark:text-indigo-300 mt-1 font-mono">
                    Range: [{formatNumber(selectedTrajectory.forecast90Days.confidenceLow, 1)} – {formatNumber(selectedTrajectory.forecast90Days.confidenceHigh, 1)}]
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-indigo-400 font-mono">Awaiting Data</span>
                  </div>
                  <div className="text-[11px] text-indigo-500/80 mt-1">
                    Single baseline recorded
                  </div>
                </>
              )}
            </div>

            {/* 4. Target Gap & Status */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clinical Status</span>
              <div className="mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${
                  statusDetails.statusColor === "rose" 
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
                    : statusDetails.statusColor === "amber"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                }`}>
                  {statusDetails.statusText}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                {selectedTrajectory.historicalReadings.length} verified observations
              </div>
            </div>
          </div>

          {/* Interactive Trajectory Curve */}
          {renderForecastChart(selectedTrajectory)}

          {/* Clinical Alert if applicable */}
          {selectedTrajectory.trajectoryAlert && (
            <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Clinical Care Note: </span>
                <span>{selectedTrajectory.trajectoryAlert}</span>
              </div>
            </div>
          )}

          {/* Doctor-Specific Advanced Metrics Panel */}
          {role === "doctor" && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-indigo-600" />
                  Clinician Goodness-of-Fit & Model Quality Audit
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                  Method: {selectedTrajectory.modelDetails.algorithm}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">R² Goodness of Fit</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatNumber(selectedTrajectory.modelDetails.rSquared, 3)}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Standard Error (sₑ)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">±{formatNumber(selectedTrajectory.modelDetails.standardError, 2)} {selectedTrajectory.unit}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Daily Slope (β₁)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{formatVelocity(selectedTrajectory.modelDetails.slope, 4)} /day</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Confidence Level</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTrajectory.modelDetails.confidenceBandPercent}% (t-dist)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Clinical Synthesis & Practical Takeaways */}
      {report.geminiSynthesis && (
        <div className="p-5 bg-gradient-to-br from-indigo-50/40 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Clinical Context & Suggested Actions
            </span>
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-white/80 dark:bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/40">
              AI Health Navigator
            </span>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {report.geminiSynthesis.clinicalImpression || report.geminiSynthesis.summary}
          </p>

          {report.geminiSynthesis.preventiveActions && report.geminiSynthesis.preventiveActions.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 block">
                {role === "doctor" ? "Recommended Physician Action Items:" : "Proactive Steps You Can Take:"}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {report.geminiSynthesis.preventiveActions.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/70 p-2.5 rounded-xl border border-indigo-100/60 dark:border-indigo-900/40">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Secondary "How This Forecast Works" Accordion */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer py-1"
        >
          <span className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            How this AI Health Forecast is calculated
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showHowItWorks ? "rotate-180" : ""}`} />
        </button>

        {showHowItWorks && (
          <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs space-y-3 text-slate-600 dark:text-slate-400">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">1. Verified Lab History</span>
                <p className="text-[11px] leading-relaxed">
                  Extracts historical dates and numeric lab results directly from verified hospital reports and clinical consultations.
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">2. Mathematical Modeling</span>
                <p className="text-[11px] leading-relaxed">
                  Computes longitudinal rates of change using Ordinary Least Squares time-series regression and Student's t 95% confidence bounds.
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">3. Clinical Context</span>
                <p className="text-[11px] leading-relaxed">
                  Compares predicted values with established medical guidelines (ADA, ACC/AHA) to provide meaningful lifestyle recommendations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clinical Safety Disclaimer */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-start gap-2.5 text-[10px] text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-slate-700 dark:text-slate-300">CLINICAL SAFETY NOTICE: </span>
          Predicted trajectories are mathematical estimates intended to assist health monitoring and prevent chronic disease progression. Always consult a qualified medical professional before modifying medications or dietary regimens.
        </div>
      </div>
    </div>
  );
};
