import { 
  fitBiomarkerTrajectory, 
  generateHealthTrajectoryReport, 
  SUPPORTED_BIOMARKERS, 
  RawTimelineEvent 
} from "../server/ml/trajectoryForecaster";
import { 
  reconcileMedications, 
  levenshteinSimilarity, 
  jaroWinklerSimilarity, 
  RawClinicalRecord 
} from "../server/ml/medicationReconciler";
import { BiomarkerReading } from "../src/types";

async function runTestSuite() {
  console.log("==================================================");
  console.log("HEALTH-TRIBE GENUINE ML INTELLIGENCE TEST SUITE");
  console.log("==================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || ""}`);
    }
  }

  // TEST 1: Trajectory Forecasting with Historical Longitudinal Readings (HbA1c progression)
  console.log("--- TEST GROUP 1: Health Trajectory ML Mathematical Engine ---");
  const testReadingsHbA1c: BiomarkerReading[] = [
    { date: "2024-01-10", value: 6.8, unit: "%", source: "Apollo Hospital", status: "Elevated" },
    { date: "2024-07-15", value: 7.4, unit: "%", source: "Max Healthcare", status: "High" },
    { date: "2025-02-20", value: 8.0, unit: "%", source: "Fortis Hospital", status: "High" },
    { date: "2025-08-10", value: 8.6, unit: "%", source: "Apollo Hospital", status: "Critical" }
  ];

  const hba1cDef = SUPPORTED_BIOMARKERS.find(b => b.key === "hba1c")!;
  const trajectory = fitBiomarkerTrajectory("hba1c", testReadingsHbA1c, hba1cDef);

  assert(trajectory.trendDirection === "RISING", "Correctly classifies rising HbA1c as RISING");
  assert(trajectory.velocityPerMonth > 0, `Positive monthly velocity calculated: ${trajectory.velocityPerMonth.toFixed(4)} %/mo`);
  assert(trajectory.allForecastPoints.length === 3, "Generates 30, 60, and 90 day future forecast points");
  assert(trajectory.modelDetails.rSquared > 0.95, `High statistical goodness-of-fit R^2: ${trajectory.modelDetails.rSquared.toFixed(4)}`);
  assert(trajectory.forecast30Days.confidenceLow < trajectory.forecast30Days.value, "Confidence interval lower bound is less than point prediction");
  assert(trajectory.forecast30Days.confidenceHigh > trajectory.forecast30Days.value, "Confidence interval upper bound is greater than point prediction");

  // TEST 2: Trajectory with Single-Data Point
  const singleReading: BiomarkerReading[] = [
    { date: "2025-01-10", value: 120, unit: "mg/dL", source: "Apollo Hospital", status: "Elevated" }
  ];
  const fastingDef = SUPPORTED_BIOMARKERS.find(b => b.key === "fasting_glucose")!;
  const singleReport = fitBiomarkerTrajectory("fasting_glucose", singleReading, fastingDef);
  assert(singleReport.trendDirection === "STABLE", "Correctly handles single-reading baseline fallback");

  // TEST 3: String Similarity & Generic Equivalence Distance Algorithms
  console.log("\n--- TEST GROUP 2: Medical Entity Resolution & NLP Algorithms ---");
  const sim1 = jaroWinklerSimilarity("Metformin Hydrochloride", "Metformin HCL");
  assert(sim1 > 0.85, `High Jaro-Winkler similarity for abbreviation (${sim1.toFixed(3)})`);

  const sim2 = levenshteinSimilarity("Atorvastatin", "Atorva");
  assert(sim2 > 0.45, `Levenshtein distance handles prefix matching (${sim2.toFixed(3)})`);

  // TEST 4: Multi-Hospital Medication Reconciliation Pipeline
  console.log("\n--- TEST GROUP 3: Multi-Hospital Cross-Facility Deduplication ---");
  const rawRecords: RawClinicalRecord[] = [
    {
      id: "rec-1",
      date: "2025-01-15",
      title: "Diabetology Consultation",
      category: "consultation",
      hospital: "Apollo Hospitals",
      doctorName: "Dr. Arvind Mehta",
      details: "Prescription: Glycomet 500mg (Metformin) once daily after breakfast. Continue routine monitoring."
    },
    {
      id: "rec-2",
      date: "2025-04-10",
      title: "Endocrinology Second Opinion",
      category: "consultation",
      hospital: "Fortis Memorial",
      doctorName: "Dr. R. K. Sharma",
      details: "Prescription: Metformin Hydrochloride 500mg twice daily with meals. Monitor glycemic levels."
    },
    {
      id: "rec-3",
      date: "2025-05-01",
      title: "Cardiology Review",
      category: "consultation",
      hospital: "Max Healthcare",
      doctorName: "Dr. S. Nair",
      details: "Prescription: Atorva 20mg (Atorvastatin) once daily at night. Lipid control protocol."
    },
    {
      id: "rec-4",
      date: "2025-05-15",
      title: "Cardiovascular Follow-up",
      category: "consultation",
      hospital: "Apollo Hospitals",
      doctorName: "Dr. Arvind Mehta",
      details: "Prescription: Lipitor 20mg once daily at bedtime. Continue strict cholesterol management."
    }
  ];

  const report = reconcileMedications("test-patient-123", rawRecords);

  assert(report.totalMedicationsFound >= 3, `Analyzed ${report.totalMedicationsFound} extracted prescriptions`);
  assert(report.duplicatesDetectedCount > 0, `Detected ${report.duplicatesDetectedCount} cross-facility duplicate conflict groups`);
  assert(report.reconciledMasterList.length > 0, `Generated ${report.reconciledMasterList.length} unified medication list entries`);
  
  // Verify provenance and non-destructive properties
  const metforminConflict = report.conflicts.find(c => c.activeMolecule.toLowerCase().includes("metformin"));
  assert(!!metforminConflict, "Found cross-facility duplicate conflict for Metformin molecule between Apollo and Fortis");
  assert(metforminConflict ? (metforminConflict.conflictingMedications.length + 1) === 2 : false, "Preserved all 2 distinct hospital source records in conflict group");

  console.log("\n==================================================");
  console.log(`TEST EXECUTION FINISHED: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log("==================================================");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error("Test Suite execution failed:", err);
  process.exit(1);
});
