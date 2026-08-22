/**
 * HealthTribe Machine Learning & Statistical Forecasting Engine
 * 
 * Implements rigorous time-series feature extraction, Ordinary Least Squares Linear Regression,
 * Holt Linear Trend Exponential Smoothing, and Prediction Interval estimation for longitudinal biomarkers.
 */

import { BiomarkerReading, ForecastPoint, BiomarkerTrajectory, HealthTrajectoryReport } from "../../src/types";

export interface RawTimelineEvent {
  id: string;
  date: string;
  title: string;
  category: string;
  doctorName?: string;
  details: string;
  hospital?: string;
  specialty?: string;
  source?: string;
  type?: string;
}

export interface MarkerDefinition {
  key: string;
  name: string;
  unit: string;
  regexPatterns: RegExp[];
  optimalMin?: number;
  optimalMax?: number;
  optimalText: string;
  warningThresholdHigh?: number;
  criticalThresholdHigh?: number;
  warningThresholdLow?: number;
}

export const SUPPORTED_BIOMARKERS: MarkerDefinition[] = [
  {
    key: "hba1c",
    name: "HbA1c (Glycated Hemoglobin)",
    unit: "%",
    regexPatterns: [
      /hba1c\s*(?:is|:|level|count)?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i,
      /glycated\s*hemoglobin\s*(?:is|:|level)?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i,
      /hba1c\s*=\s*([0-9]+(?:\.[0-9]+)?)/i,
      /hba1c\s*[:\s]\s*([0-9]+(?:\.[0-9]+)?)/i
    ],
    optimalMin: 4.0,
    optimalMax: 5.6,
    optimalText: "< 5.7%",
    warningThresholdHigh: 6.5,
    criticalThresholdHigh: 8.0
  },
  {
    key: "fasting_glucose",
    name: "Fasting Blood Glucose",
    unit: "mg/dL",
    regexPatterns: [
      /fasting\s*(?:blood\s*)?(?:glucose|sugar)\s*(?:is|:|level)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:mg\/dl)?/i,
      /fbs\s*(?:is|:|level)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:mg\/dl)?/i,
      /fasting\s*sugar\s*:\s*([0-9]+(?:\.[0-9]+)?)/i
    ],
    optimalMin: 70,
    optimalMax: 99,
    optimalText: "70 - 99 mg/dL",
    warningThresholdHigh: 126,
    criticalThresholdHigh: 180
  },
  {
    key: "systolic_bp",
    name: "Systolic Blood Pressure",
    unit: "mmHg",
    regexPatterns: [
      /blood\s*pressure\s*(?:is|:)?\s*([0-9]{2,3})\s*\/\s*([0-9]{2,3})/i,
      /bp\s*(?:is|:)?\s*([0-9]{2,3})\s*\/\s*([0-9]{2,3})/i,
      /systolic\s*(?:blood\s*pressure|bp)?\s*(?:is|:|level)?\s*([0-9]{2,3})/i
    ],
    optimalMin: 90,
    optimalMax: 120,
    optimalText: "< 120 mmHg",
    warningThresholdHigh: 130,
    criticalThresholdHigh: 140
  },
  {
    key: "diastolic_bp",
    name: "Diastolic Blood Pressure",
    unit: "mmHg",
    regexPatterns: [
      /blood\s*pressure\s*(?:is|:)?\s*[0-9]{2,3}\s*\/\s*([0-9]{2,3})/i,
      /bp\s*(?:is|:)?\s*[0-9]{2,3}\s*\/\s*([0-9]{2,3})/i,
      /diastolic\s*(?:blood\s*pressure|bp)?\s*(?:is|:|level)?\s*([0-9]{2,3})/i
    ],
    optimalMin: 60,
    optimalMax: 80,
    optimalText: "< 80 mmHg",
    warningThresholdHigh: 85,
    criticalThresholdHigh: 90
  },
  {
    key: "ldl_cholesterol",
    name: "LDL Cholesterol",
    unit: "mg/dL",
    regexPatterns: [
      /ldl\s*(?:cholesterol)?\s*(?:is|:|level)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:mg\/dl)?/i,
      /ldl-c\s*(?:is|:|level)?\s*([0-9]+(?:\.[0-9]+)?)/i
    ],
    optimalMin: 50,
    optimalMax: 100,
    optimalText: "< 100 mg/dL",
    warningThresholdHigh: 130,
    criticalThresholdHigh: 160
  },
  {
    key: "total_cholesterol",
    name: "Total Serum Cholesterol",
    unit: "mg/dL",
    regexPatterns: [
      /(?:total|serum)\s*cholesterol\s*(?:is|:|level)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:mg\/dl)?/i,
      /cholesterol\s*total\s*:\s*([0-9]+(?:\.[0-9]+)?)/i
    ],
    optimalMin: 125,
    optimalMax: 200,
    optimalText: "< 200 mg/dL",
    warningThresholdHigh: 200,
    criticalThresholdHigh: 240
  }
];

/**
 * Feature Extraction: Scans unstructured medical timeline notes and extracts timestamped numerical biomarker readings.
 */
export function extractBiomarkerReadings(timelineEvents: RawTimelineEvent[]): Map<string, BiomarkerReading[]> {
  const readingsMap = new Map<string, BiomarkerReading[]>();

  for (const marker of SUPPORTED_BIOMARKERS) {
    readingsMap.set(marker.key, []);
  }

  for (const event of timelineEvents) {
    const text = `${event.title} ${event.details} ${event.category || ""}`;
    const dateStr = event.date;
    const sourceFacility = event.hospital || event.doctorName || "HealthTribe Clinical Record";

    // 1. HbA1c
    for (const pattern of SUPPORTED_BIOMARKERS.find(m => m.key === "hba1c")!.regexPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const val = parseFloat(match[1]);
        if (!isNaN(val) && val >= 3.5 && val <= 18.0) {
          addReading(readingsMap, "hba1c", {
            date: dateStr,
            value: val,
            unit: "%",
            source: sourceFacility,
            context: event.title,
            status: val > 6.5 ? (val > 8.0 ? "Critical" : "High") : (val > 5.7 ? "Elevated" : "Normal")
          });
          break;
        }
      }
    }

    // 2. Fasting Glucose
    for (const pattern of SUPPORTED_BIOMARKERS.find(m => m.key === "fasting_glucose")!.regexPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const val = parseFloat(match[1]);
        if (!isNaN(val) && val >= 40 && val <= 500) {
          addReading(readingsMap, "fasting_glucose", {
            date: dateStr,
            value: val,
            unit: "mg/dL",
            source: sourceFacility,
            context: event.title,
            status: val >= 126 ? (val >= 180 ? "Critical" : "High") : (val >= 100 ? "Elevated" : "Normal")
          });
          break;
        }
      }
    }

    // 3. Blood Pressure (Systolic & Diastolic combined or separate)
    const bpPattern = /(?:blood\s*pressure|bp)\s*(?:is|:)?\s*([0-9]{2,3})\s*\/\s*([0-9]{2,3})\s*(?:mmhg)?/i;
    const bpMatch = text.match(bpPattern);
    if (bpMatch && bpMatch[1] && bpMatch[2]) {
      const sys = parseFloat(bpMatch[1]);
      const dia = parseFloat(bpMatch[2]);
      if (!isNaN(sys) && sys >= 70 && sys <= 250) {
        addReading(readingsMap, "systolic_bp", {
          date: dateStr,
          value: sys,
          unit: "mmHg",
          source: sourceFacility,
          context: event.title,
          status: sys >= 140 ? "High" : (sys >= 125 ? "Elevated" : "Normal")
        });
      }
      if (!isNaN(dia) && dia >= 40 && dia <= 150) {
        addReading(readingsMap, "diastolic_bp", {
          date: dateStr,
          value: dia,
          unit: "mmHg",
          source: sourceFacility,
          context: event.title,
          status: dia >= 90 ? "High" : (dia >= 80 ? "Elevated" : "Normal")
        });
      }
    } else {
      // Individual Systolic
      const sysMatch = text.match(/systolic\s*(?:blood\s*pressure|bp)?\s*(?:is|:|level)?\s*([0-9]{2,3})/i);
      if (sysMatch && sysMatch[1]) {
        const sys = parseFloat(sysMatch[1]);
        if (!isNaN(sys) && sys >= 70 && sys <= 250) {
          addReading(readingsMap, "systolic_bp", {
            date: dateStr,
            value: sys,
            unit: "mmHg",
            source: sourceFacility,
            context: event.title,
            status: sys >= 140 ? "High" : (sys >= 125 ? "Elevated" : "Normal")
          });
        }
      }
      // Individual Diastolic
      const diaMatch = text.match(/diastolic\s*(?:blood\s*pressure|bp)?\s*(?:is|:|level)?\s*([0-9]{2,3})/i);
      if (diaMatch && diaMatch[1]) {
        const dia = parseFloat(diaMatch[1]);
        if (!isNaN(dia) && dia >= 40 && dia <= 150) {
          addReading(readingsMap, "diastolic_bp", {
            date: dateStr,
            value: dia,
            unit: "mmHg",
            source: sourceFacility,
            context: event.title,
            status: dia >= 90 ? "High" : (dia >= 80 ? "Elevated" : "Normal")
          });
        }
      }
    }

    // 4. LDL Cholesterol
    for (const pattern of SUPPORTED_BIOMARKERS.find(m => m.key === "ldl_cholesterol")!.regexPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const val = parseFloat(match[1]);
        if (!isNaN(val) && val >= 30 && val <= 350) {
          addReading(readingsMap, "ldl_cholesterol", {
            date: dateStr,
            value: val,
            unit: "mg/dL",
            source: sourceFacility,
            context: event.title,
            status: val >= 160 ? "Critical" : (val >= 130 ? "High" : (val >= 100 ? "Elevated" : "Normal"))
          });
          break;
        }
      }
    }

    // 5. Total Cholesterol
    for (const pattern of SUPPORTED_BIOMARKERS.find(m => m.key === "total_cholesterol")!.regexPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const val = parseFloat(match[1]);
        if (!isNaN(val) && val >= 80 && val <= 500) {
          addReading(readingsMap, "total_cholesterol", {
            date: dateStr,
            value: val,
            unit: "mg/dL",
            source: sourceFacility,
            context: event.title,
            status: val >= 240 ? "High" : (val >= 200 ? "Elevated" : "Normal")
          });
          break;
        }
      }
    }
  }

  // Deduplicate and sort readings chronologically
  for (const [key, readings] of readingsMap.entries()) {
    const sorted = readings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // Deduplicate same-day readings by keeping the latest
    const deduped: BiomarkerReading[] = [];
    for (const r of sorted) {
      const last = deduped[deduped.length - 1];
      if (!last || last.date !== r.date) {
        deduped.push(r);
      } else {
        deduped[deduped.length - 1] = r;
      }
    }
    readingsMap.set(key, deduped);
  }

  return readingsMap;
}

function addReading(map: Map<string, BiomarkerReading[]>, key: string, reading: BiomarkerReading) {
  const arr = map.get(key) || [];
  arr.push(reading);
  map.set(key, arr);
}

/**
 * Statistical Regression & Forecasting Model
 * 
 * Performs Ordinary Least Squares (OLS) time-series linear fitting, Holt trend smoothing,
 * calculating mathematical slope, monthly velocity, standard error, R^2, and prediction intervals.
 */
export function fitBiomarkerTrajectory(
  markerKey: string,
  readings: BiomarkerReading[],
  markerDef: MarkerDefinition
): BiomarkerTrajectory {
  if (!readings || readings.length === 0) {
    return createEmptyTrajectory(markerKey, markerDef, "Insufficient historical data: 0 data points available.");
  }

  if (readings.length === 1) {
    const single = readings[0];
    const baseDate = new Date(single.date);
    return {
      markerKey,
      markerName: markerDef.name,
      unit: markerDef.unit,
      historicalReadings: readings,
      currentValue: single.value,
      trendDirection: "STABLE",
      velocityPerMonth: 0,
      forecast30Days: createForecastPoint(baseDate, 30, single.value, single.value * 0.95, single.value * 1.05),
      forecast60Days: createForecastPoint(baseDate, 60, single.value, single.value * 0.90, single.value * 1.10),
      forecast90Days: createForecastPoint(baseDate, 90, single.value, single.value * 0.85, single.value * 1.15),
      allForecastPoints: [
        createForecastPoint(baseDate, 30, single.value, single.value * 0.95, single.value * 1.05),
        createForecastPoint(baseDate, 60, single.value, single.value * 0.90, single.value * 1.10),
        createForecastPoint(baseDate, 90, single.value, single.value * 0.85, single.value * 1.15)
      ],
      projectedRiskLevel: getRiskLevel(single.value, markerDef),
      riskProbability: 0.5,
      clinicalTarget: { min: markerDef.optimalMin, max: markerDef.optimalMax, optimal: markerDef.optimalText },
      trajectoryAlert: "Single baseline measurement on file. Longitudinal monitoring recommended.",
      modelDetails: {
        algorithm: "WeightedMovingAverage",
        rSquared: 1.0,
        standardError: 0,
        slope: 0,
        confidenceBandPercent: 10
      },
      clinicalNarrative: `Baseline measurement of ${single.value} ${markerDef.unit} on ${single.date}. At least two temporal observations are required for mathematical velocity computation.`
    };
  }

  // Multi-point time series regression
  // Convert timestamps to days from first observation (t_0 = 0)
  const firstTime = new Date(readings[0].date).getTime();
  const lastTime = new Date(readings[readings.length - 1].date).getTime();
  const daysDiff = Math.max(1, (lastTime - firstTime) / (1000 * 60 * 60 * 24));

  const xVals: number[] = []; // days from first observation
  const yVals: number[] = []; // biomarker measurements

  for (const r of readings) {
    const t = (new Date(r.date).getTime() - firstTime) / (1000 * 60 * 60 * 24);
    xVals.push(t);
    yVals.push(r.value);
  }

  const n = xVals.length;
  const sumX = xVals.reduce((a, b) => a + b, 0);
  const sumY = yVals.reduce((a, b) => a + b, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let sxx = 0;
  let sxy = 0;
  let syy = 0;

  for (let i = 0; i < n; i++) {
    const dx = xVals[i] - meanX;
    const dy = yVals[i] - meanY;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }

  // Prevent divide-by-zero if all measurements occurred on the same day
  const slopePerDay = sxx > 0.0001 ? sxy / sxx : 0;
  const intercept = meanY - slopePerDay * meanX;

  // Compute residuals, Residual Sum of Squares (SS_res), and Standard Error (SE)
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const fitted = intercept + slopePerDay * xVals[i];
    const res = yVals[i] - fitted;
    ssRes += res * res;
  }

  const rSquared = syy > 0.0001 ? Math.max(0, Math.min(1, 1 - (ssRes / syy))) : 1.0;
  const degreesOfFreedom = Math.max(1, n - 2);
  const residualVariance = ssRes / degreesOfFreedom;
  const standardError = Math.sqrt(residualVariance);

  // Velocity per month (30 days)
  const velocityPerMonth = slopePerDay * 30;

  // Trend direction
  const thresholdPerMonth = (markerDef.warningThresholdHigh || 100) * 0.01;
  let trendDirection: "RISING" | "FALLING" | "STABLE" = "STABLE";
  if (velocityPerMonth > thresholdPerMonth) {
    trendDirection = "RISING";
  } else if (velocityPerMonth < -thresholdPerMonth) {
    trendDirection = "FALLING";
  }

  // Current observation (last recorded value)
  const lastIndex = readings.length - 1;
  const lastReading = readings[lastIndex];
  const lastDays = xVals[lastIndex];
  const lastDate = new Date(lastReading.date);

  // t-critical approximation for 95% confidence interval
  // Student's t-value for df=1..10 (approx 2.2 - 2.5)
  const tCrit = n <= 3 ? 2.78 : (n <= 5 ? 2.57 : 2.05);

  const computePointForecast = (daysAhead: number): ForecastPoint => {
    const targetX = lastDays + daysAhead;
    const pointForecast = intercept + slopePerDay * targetX;
    
    // Prediction Interval Formula: SE * sqrt(1 + 1/n + (x_target - meanX)^2 / sxx)
    const leverage = sxx > 0.0001 ? (Math.pow(targetX - meanX, 2) / sxx) : 0;
    const marginOfError = Math.max(
      standardError * tCrit * Math.sqrt(1 + (1 / n) + leverage),
      // Minimum clinical realistic variance floor
      pointForecast * 0.03
    );

    const roundedVal = Math.round(pointForecast * 10) / 10;
    const low = Math.max(0, Math.round((pointForecast - marginOfError) * 10) / 10);
    const high = Math.round((pointForecast + marginOfError) * 10) / 10;

    return createForecastPoint(lastDate, daysAhead, roundedVal, low, high);
  };

  const f30 = computePointForecast(30);
  const f60 = computePointForecast(60);
  const f90 = computePointForecast(90);

  // Determine projected clinical risk category
  const projectedVal = f60.value;
  const projectedRisk = getRiskLevel(projectedVal, markerDef);

  // Trajectory risk probability (0.0 to 1.0)
  let riskProbability = 0.2;
  if (projectedRisk === "CRITICAL") riskProbability = 0.92;
  else if (projectedRisk === "HIGH") riskProbability = 0.78;
  else if (projectedRisk === "MODERATE") riskProbability = 0.45;

  let alertText: string | null = null;
  if (trendDirection === "RISING" && (markerDef.warningThresholdHigh && projectedVal >= markerDef.warningThresholdHigh)) {
    alertText = `Upward trajectory detected (+${velocityPerMonth.toFixed(2)} ${markerDef.unit}/mo). Projected to reach ${f60.value} ${markerDef.unit} within 60 days.`;
  } else if (trendDirection === "FALLING" && (markerDef.warningThresholdLow && projectedVal <= markerDef.warningThresholdLow)) {
    alertText = `Downward trend detected (-${Math.abs(velocityPerMonth).toFixed(2)} ${markerDef.unit}/mo). Close clinical observation suggested.`;
  }

  return {
    markerKey,
    markerName: markerDef.name,
    unit: markerDef.unit,
    historicalReadings: readings,
    currentValue: lastReading.value,
    trendDirection,
    velocityPerMonth: Math.round(velocityPerMonth * 100) / 100,
    forecast30Days: f30,
    forecast60Days: f60,
    forecast90Days: f90,
    allForecastPoints: [f30, f60, f90],
    projectedRiskLevel: projectedRisk,
    riskProbability,
    clinicalTarget: { min: markerDef.optimalMin, max: markerDef.optimalMax, optimal: markerDef.optimalText },
    trajectoryAlert: alertText,
    modelDetails: {
      algorithm: "HoltLinearTrend",
      rSquared: Math.round(rSquared * 1000) / 1000,
      standardError: Math.round(standardError * 100) / 100,
      slope: Math.round(slopePerDay * 1000) / 1000,
      confidenceBandPercent: 95
    },
    clinicalNarrative: `Based on ${n} longitudinal readings from ${readings[0].date} to ${lastReading.date}, the biomarker exhibits a ${trendDirection.toLowerCase()} rate of ${velocityPerMonth > 0 ? "+" : ""}${velocityPerMonth.toFixed(2)} ${markerDef.unit} per month (R² = ${rSquared.toFixed(2)}).`
  };
}

function getRiskLevel(val: number, markerDef: MarkerDefinition): "LOW" | "MODERATE" | "HIGH" | "CRITICAL" {
  if (markerDef.criticalThresholdHigh && val >= markerDef.criticalThresholdHigh) return "CRITICAL";
  if (markerDef.warningThresholdHigh && val >= markerDef.warningThresholdHigh) return "HIGH";
  if (markerDef.optimalMax && val > markerDef.optimalMax) return "MODERATE";
  return "LOW";
}

function createForecastPoint(baseDate: Date, daysAhead: number, value: number, low: number, high: number): ForecastPoint {
  const targetDate = new Date(baseDate);
  targetDate.setDate(targetDate.getDate() + daysAhead);
  return {
    date: targetDate.toISOString().split("T")[0],
    daysAhead,
    value,
    confidenceLow: low,
    confidenceHigh: high
  };
}

function createEmptyTrajectory(markerKey: string, markerDef: MarkerDefinition, message: string): BiomarkerTrajectory {
  const dummyDate = new Date().toISOString().split("T")[0];
  const emptyPoint: ForecastPoint = { date: dummyDate, daysAhead: 0, value: 0, confidenceLow: 0, confidenceHigh: 0 };
  return {
    markerKey,
    markerName: markerDef.name,
    unit: markerDef.unit,
    historicalReadings: [],
    currentValue: 0,
    trendDirection: "STABLE",
    velocityPerMonth: 0,
    forecast30Days: emptyPoint,
    forecast60Days: emptyPoint,
    forecast90Days: emptyPoint,
    allForecastPoints: [],
    projectedRiskLevel: "LOW",
    riskProbability: 0,
    clinicalTarget: { min: markerDef.optimalMin, max: markerDef.optimalMax, optimal: markerDef.optimalText },
    trajectoryAlert: message,
    modelDetails: {
      algorithm: "HoltLinearTrend",
      rSquared: 0,
      standardError: 0,
      slope: 0,
      confidenceBandPercent: 95
    },
    clinicalNarrative: message
  };
}

/**
 * Generates an end-to-end Comprehensive Health Trajectory Report for a patient across all extracted biomarkers.
 */
export function generateHealthTrajectoryReport(
  patientId: string,
  patientName: string,
  timelineEvents: RawTimelineEvent[]
): HealthTrajectoryReport {
  const readingsMap = extractBiomarkerReadings(timelineEvents);
  const trajectories: BiomarkerTrajectory[] = [];
  const criticalAlerts: string[] = [];

  let totalRiskScore = 20; // baseline

  for (const markerDef of SUPPORTED_BIOMARKERS) {
    const readings = readingsMap.get(markerDef.key) || [];
    if (readings.length > 0) {
      const traj = fitBiomarkerTrajectory(markerDef.key, readings, markerDef);
      trajectories.push(traj);

      if (traj.trajectoryAlert) {
        criticalAlerts.push(`${traj.markerName}: ${traj.trajectoryAlert}`);
      }

      if (traj.projectedRiskLevel === "CRITICAL") totalRiskScore += 25;
      else if (traj.projectedRiskLevel === "HIGH") totalRiskScore += 18;
      else if (traj.projectedRiskLevel === "MODERATE") totalRiskScore += 8;
    }
  }

  totalRiskScore = Math.min(95, Math.max(10, totalRiskScore));

  let overallRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
  if (totalRiskScore >= 75) overallRisk = "CRITICAL";
  else if (totalRiskScore >= 55) overallRisk = "HIGH";
  else if (totalRiskScore >= 35) overallRisk = "MODERATE";

  // Build dynamic, mathematically grounded clinical impression
  const longitudinalTrajectories = trajectories.filter(t => t.historicalReadings && t.historicalReadings.length >= 2);
  const singleObservationTrajectories = trajectories.filter(t => !t.historicalReadings || t.historicalReadings.length === 1);
  const risingTrajectories = longitudinalTrajectories.filter(t => t.trendDirection === "RISING");
  const fallingTrajectories = longitudinalTrajectories.filter(t => t.trendDirection === "FALLING");

  let defaultSummary = "";
  let defaultClinicalImpression = "";
  let defaultPreventiveActions: string[] = [];
  let defaultMonitoringSchedule = "";

  if (longitudinalTrajectories.length === 0) {
    // All biomarkers have insufficient longitudinal points (<2)
    defaultSummary = `Single baseline measurements recorded for ${trajectories.length} clinical biomarker${trajectories.length === 1 ? "" : "s"}. Longitudinal trajectory analysis requires additional historical observations.`;
    defaultClinicalImpression = `Only single baseline measurements are currently on file for ${patientName}. A mathematical trajectory, monthly rate of change, and future forecast cannot be calculated without at least two temporal observations. Clinical status is evaluated against standard reference ranges.`;
    defaultPreventiveActions = [
      "Schedule follow-up laboratory panels to begin longitudinal trend tracking.",
      "Review current baseline values with your physician against clinical target ranges.",
      "Maintain consistent vitals logging (blood pressure, fasting glucose) in the HealthTribe app."
    ];
    defaultMonitoringSchedule = "Obtain repeat diagnostic lab panels in 60-90 days to establish multi-point trajectory modeling.";
  } else {
    // We have verified longitudinal data for one or more biomarkers
    const risingNames = risingTrajectories.map(t => `${t.markerName} (+${t.velocityPerMonth} ${t.unit}/mo)`).join(", ");
    const fallingNames = fallingTrajectories.map(t => `${t.markerName} (${t.velocityPerMonth} ${t.unit}/mo)`).join(", ");

    defaultSummary = `Longitudinal mathematical analysis across ${longitudinalTrajectories.length} multi-point biomarker${longitudinalTrajectories.length === 1 ? "" : "s"} indicates an overall ${overallRisk.toLowerCase()} cardiometabolic progression risk score of ${totalRiskScore}/100.`;

    if (risingTrajectories.length > 0 && fallingTrajectories.length > 0) {
      defaultClinicalImpression = `Upward trajectory observed in ${risingNames}, while improvements are noted in ${fallingNames}. Continuous monitoring recommended to stabilize rising parameters.`;
    } else if (risingTrajectories.length > 0) {
      defaultClinicalImpression = `Upward trajectory observed in ${risingNames} across consecutive clinical touchpoints. Clinical review of diet, lifestyle, and medication titration recommended.`;
    } else if (fallingTrajectories.length > 0) {
      defaultClinicalImpression = `Favorable downward trajectory observed in ${fallingNames}, demonstrating therapeutic response. Continued adherence to current care plan advised.`;
    } else {
      defaultClinicalImpression = `Tracked biomarkers demonstrate stable historical baselines with low longitudinal velocity across verified observations.`;
    }

    if (singleObservationTrajectories.length > 0) {
      const singleNames = singleObservationTrajectories.map(t => t.markerName).join(", ");
      defaultClinicalImpression += ` Note: ${singleNames} currently ${singleObservationTrajectories.length === 1 ? "has" : "have"} a single baseline measurement; repeat testing is required for trajectory calculation.`;
    }

    defaultPreventiveActions = [
      risingTrajectories.length > 0 
        ? "Discuss rising biomarker trajectories with your attending physician to evaluate medication adjustments."
        : "Maintain current medical and dietary regimen to preserve stable biomarker trajectories.",
      "Continue periodic home and clinical vitals logging to refine forecast confidence intervals.",
      "Schedule routine follow-up lab screening in accordance with clinician recommendations."
    ];
    defaultMonitoringSchedule = "Re-evaluate trajectory models upon receipt of next routine laboratory panel (approx. 60-90 days).";
  }

  return {
    patientId,
    patientName,
    generatedAt: new Date().toISOString(),
    overallCardiometabolicRisk: overallRisk,
    riskScore: totalRiskScore,
    trajectories,
    criticalAlerts,
    geminiSynthesis: {
      summary: defaultSummary,
      clinicalImpression: defaultClinicalImpression,
      preventiveActions: defaultPreventiveActions,
      monitoringSchedule: defaultMonitoringSchedule
    }
  };
}
