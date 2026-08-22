/**
 * ML Engines Verification Test Script
 * Tests Trajectory Forecasting and Multi-Hospital Medication Reconciliation.
 */

import { extractBiomarkerReadings, fitBiomarkerTrajectory, SUPPORTED_BIOMARKERS, generateHealthTrajectoryReport } from "./trajectoryForecaster.js";
import { extractMedicationsFromRecords, reconcileMedications, jaroWinklerSimilarity, levenshteinSimilarity } from "./medicationReconciler.js";

console.log("==================================================");
console.log("RUNNING PHASE 2 ML ENGINES VERIFICATION");
console.log("==================================================");

// ----------------------------------------------------
// TEST 1: String Similarity & Entity Resolution
// ----------------------------------------------------
console.log("\n[TEST 1] String Similarity & Entity Resolution");
const jw1 = jaroWinklerSimilarity("Metformin 500mg", "Glycomet 500mg");
const lev1 = levenshteinSimilarity("Metformin 500mg", "Glycomet 500mg");
console.log(`- Metformin vs Glycomet: JW=${jw1.toFixed(3)}, Levenshtein=${lev1.toFixed(3)}`);

const jw2 = jaroWinklerSimilarity("Metformin 500mg", "Metformin 500mg");
console.log(`- Exact Identity: JW=${jw2.toFixed(3)} (Expected: 1.000)`);
if (jw2 !== 1.0) throw new Error("Exact identity failed!");

// ----------------------------------------------------
// TEST 2: Multi-Hospital Medication Reconciliation
// ----------------------------------------------------
console.log("\n[TEST 2] Multi-Hospital Duplicate Medication Reconciliation");
const mockRecords = [
  {
    id: "rec-apollo-1",
    date: "2026-06-10",
    title: "Endocrinology Prescription",
    category: "Prescription",
    doctorName: "Dr. Anika Verma",
    details: "Rx: Metformin 500mg (OD, after breakfast) and Atorvastatin 10mg (HS).",
    hospital: "Apollo Hospitals",
    source: "ABHA"
  },
  {
    id: "rec-fortis-1",
    date: "2026-06-21",
    title: "Cardiology Prescription",
    category: "Prescription",
    doctorName: "Dr. Vikram Seth",
    details: "Rx: Glycomet 500mg (Metformin brand) 1 tablet twice daily. Lipitor 10mg (Atorvastatin brand) 1 tablet bedtime.",
    hospital: "Fortis Escorts Heart Institute",
    source: "ABHA"
  },
  {
    id: "rec-manipal-1",
    date: "2026-03-15",
    title: "Outpatient Diabetes Prescription",
    category: "Prescription",
    doctorName: "Dr. Rajesh Kulkarni",
    details: "Rx: Glucophage 500mg once daily after food. Atorva 10mg at night.",
    hospital: "Manipal Hospital",
    source: "ABHA"
  }
];

const reconciliation = reconcileMedications("test-patient-1", mockRecords);
console.log(`- Total Records Evaluated: ${reconciliation.totalRecordsEvaluated}`);
console.log(`- Total Extracted Medications: ${reconciliation.totalMedicationsFound}`);
console.log(`- Duplicate Conflicts Identified: ${reconciliation.conflicts.length}`);
console.log(`- Unified Master List Length: ${reconciliation.reconciledMasterList.length}`);

for (const c of reconciliation.conflicts) {
  console.log(`  * Conflict [${c.conflictType}] on molecule '${c.activeMolecule}': Score=${c.similarityScore}, Confidence=${c.matchConfidence}%, Severity=${c.clinicalRiskSeverity}`);
}

if (reconciliation.conflicts.length === 0) {
  throw new Error("Expected duplicate conflicts to be detected across Apollo, Fortis, and Manipal!");
}

// ----------------------------------------------------
// TEST 3: Health Trajectory Time-Series Regression
// ----------------------------------------------------
console.log("\n[TEST 3] Longitudinal Health Trajectory Forecasting");
const mockTimeline = [
  {
    id: "t-1",
    date: "2026-03-10",
    title: "Baseline Executive Health Screening",
    category: "Lab Report",
    details: "Fasting Blood Glucose: 118 mg/dL. HbA1c: 6.6%. Blood Pressure: 122/78 mmHg. LDL Cholesterol: 122 mg/dL."
  },
  {
    id: "t-2",
    date: "2026-05-02",
    title: "Routine Review",
    category: "Lab Report",
    details: "Fasting Blood Glucose: 128 mg/dL. HbA1c: 6.9%. Blood Pressure: 128/82 mmHg. LDL Cholesterol: 132 mg/dL."
  },
  {
    id: "t-3",
    date: "2026-06-20",
    title: "Followup Panel",
    category: "Lab Report",
    details: "HbA1c: 7.4%. Fasting Blood Glucose: 142 mg/dL. Blood Pressure: 138/88 mmHg. LDL Cholesterol: 146 mg/dL."
  }
];

const trajectoryReport = generateHealthTrajectoryReport("test-patient-1", "Supriya Kilari", mockTimeline);
console.log(`- Overall Risk Score: ${trajectoryReport.riskScore}/100 (${trajectoryReport.overallCardiometabolicRisk})`);
console.log(`- Trajectories Tracked: ${trajectoryReport.trajectories.length}`);

for (const t of trajectoryReport.trajectories) {
  console.log(`  * Biomarker: ${t.markerName} (${t.unit})`);
  console.log(`    Current: ${t.currentValue} | Trend: ${t.trendDirection} | Velocity: ${t.velocityPerMonth} ${t.unit}/month | R²: ${t.modelDetails.rSquared}`);
  console.log(`    Forecast +30d: ${t.forecast30Days.value} [${t.forecast30Days.confidenceLow} - ${t.forecast30Days.confidenceHigh}]`);
  console.log(`    Forecast +60d: ${t.forecast60Days.value} [${t.forecast60Days.confidenceLow} - ${t.forecast60Days.confidenceHigh}]`);
  console.log(`    Forecast +90d: ${t.forecast90Days.value} [${t.forecast90Days.confidenceLow} - ${t.forecast90Days.confidenceHigh}]`);
}

// ----------------------------------------------------
// TEST 4: Sensitivity Test (Input Variance Leads to Dynamic Output)
// ----------------------------------------------------
console.log("\n[TEST 4] Sensitivity Test: Input Change Verification");
const decreasingTimeline = [
  {
    id: "t-1",
    date: "2026-03-10",
    title: "Screening",
    category: "Lab",
    details: "HbA1c: 8.5% Fasting Glucose: 180 mg/dL"
  },
  {
    id: "t-2",
    date: "2026-06-10",
    title: "Post-Therapy Review",
    category: "Lab",
    details: "HbA1c: 6.8% Fasting Glucose: 120 mg/dL"
  }
];

const decreasingReport = generateHealthTrajectoryReport("test-patient-2", "Test Patient", decreasingTimeline);
const hba1cDec = decreasingReport.trajectories.find(t => t.markerKey === "hba1c");
console.log(`- Decreasing Input Test: Trend=${hba1cDec?.trendDirection}, Velocity=${hba1cDec?.velocityPerMonth} %/month`);

if (hba1cDec?.trendDirection !== "FALLING" || (hba1cDec?.velocityPerMonth || 0) >= 0) {
  throw new Error("Sensitivity check failed: decreasing input did not produce falling trajectory!");
}

console.log("\n>>> ALL PHASE 2 ML ENGINE TESTS PASSED SUCCESFULLY! <<<");
