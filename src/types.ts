export interface UserAddress {
  id: string;
  fullName: string;
  mobile: string;
  house: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface Specialty {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  specialtyId: string;
  experience: number;
  rating: number;
  reviewsCount: number;
  hospital: string;
  languages: string[];
  fee: number;
  availableToday: boolean;
  avatar: string;
  bio: string;
  education: string;
  availabilitySlots: string[];
}

export interface Hospital {
  id: string;
  name: string;
  distance: string;
  rating: number;
  reviewCount?: string;
  specialties: string[];
  emergency: boolean;
  address: string;
  govBenefits: boolean;
  image: string;
  openStatus?: string;
  abhaCompatible?: boolean;
  ayushmanBharatAccepted?: boolean;
  emergencyBadge?: string;
  estimatedArrival?: {
    car: string;
    ambulance: string;
    walk: string;
  };
  phone?: string;
  website?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergies: string;
  chronicConditions: string;
  medications: string;
  height?: string;
  weight?: string;
  phone?: string;
  email?: string;
  onboardingComplete?: boolean;
  abhaNumber?: string;
  abhaVerified?: boolean;
  emergencyContact?: string;
  profileCode?: string;
  linked?: boolean;
  linkedStatus?: string;
  belongsTo?: string;
}

export interface TimelineRecord {
  id: string;
  patientId: string;
  date: string;
  title: string;
  type?: string;
  category?: string;
  doctorName?: string;
  hospital?: string;
  details: string;
  source?: "HealthTribe" | "ABHA";
  highlights?: string[];
  riskLevel?: string;
  reportAnalysis?: any;
}

export interface Medicine {
  id: string;
  name: string;
  strength: string;
  manufacturer: string;
  mrp: number;
  discount: number;
  rxRequired: boolean;
  category: string;
}

export interface PrescriptionMedicineItem {
  id: string;
  name: string;
  genericName?: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
  activeMolecule?: string;
  confidenceScore?: number;
  unclearFlag?: boolean;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorSpecialty?: string;
  doctorRegNo?: string;
  hospital: string;
  hospitalAddress?: string;
  prescriptionDate: string;
  type: "DIGITAL_E_RX" | "PHYSICAL_UPLOAD_OCR" | "ABHA_SYNCED";
  status: "VERIFIED" | "PENDING_VERIFICATION" | "REQUIRES_REVIEW" | "FULFILLED" | "PARTIALLY_FULFILLED";
  verificationMethod: "Doctor Digital Signature" | "ABHA Gateway Verified" | "AI OCR + Patient Confirmed" | "Pharmacist Review Required";
  verificationBadge?: string;
  diagnosis?: string;
  consultationId?: string;
  documentUrl?: string;
  rawExtractedText?: string;
  ocrConfidence?: "HIGH" | "MEDIUM" | "LOW";
  ocrWarnings?: string[];
  medications: PrescriptionMedicineItem[];
  fulfillmentStatus?: "NOT_FULFILLED" | "IN_CART" | "PROCESSING" | "DISPATCHED" | "DELIVERED";
  selectedPharmacy?: string;
  fulfillmentType?: "HOME_DELIVERY" | "STORE_PICKUP";
  notes?: string;
}

export interface PharmacyOption {
  id: string;
  name: string;
  branch: string;
  distanceKm: number;
  address: string;
  rating: number;
  deliveryTimeEstimate: string;
  supportsHomeDelivery: boolean;
  supportsPickup: boolean;
  inStockCompliancePercent: number;
  dispensingFee: number;
  licenseNumber: string;
}

export interface PrescriptionCartItem {
  prescriptionId: string;
  prescriptionCode: string;
  prescriptionStatus: string;
  doctorName: string;
  hospital: string;
  medicine: PrescriptionMedicineItem;
  quantity: number;
  pharmacy: PharmacyOption;
  fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP";
  unitPrice: number;
}

export interface LabTest {
  id: string;
  name: string;
  description: string;
  preparation: string;
  price: number;
  originalPrice: number;
  tags: string[];
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  patientName: string;
  date: string;
  time: string;
  status: "Upcoming" | "Completed" | "Cancelled";
  type: "In-Person" | "Video" | "Voice";
  fee: number;
  notes?: string;
  patientId?: string;
  hospital?: string;
  diagnosis?: string;
  followUp?: string;
}

export interface TriageResult {
  assessment: string;
  urgency: "RED" | "ORANGE" | "YELLOW" | "GREEN" | "BLUE";
  clinicalCategories: string[];
  followUpQuestions: string[];
  recommendations: string[];
  specialist: string;
  emergencyWarnings: string[];
  nearbyHospitalRecommendation: string;
  aiDoctorResponse: string;
}

export interface DietPlan {
  scientificRationale: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
}

export interface InteractionAlert {
  severity: "CRITICAL" | "MODERATE" | "WARNING";
  interaction: string;
  risk: string;
  advice: string;
}

export interface InteractionResponse {
  safe: boolean;
  alertsCount: number;
  alerts: InteractionAlert[];
}

export interface ReportAnalysis {
  overview?: {
    reportType: string;
    date: string;
    confidence: string;
    overallStatus: string;
  };
  clinicalInterpretation?: string;
  findings: Array<{
    marker: string;
    value: string;
    referenceRange?: string;
    status: "High" | "Normal" | "Low" | "Abnormal" | string;
    severity?: string;
    whyItMatters?: string;
    possibleCauses?: string;
    suggestedFollowUp?: string;
    trend?: "Improving" | "Worsening" | "Stable" | "New" | string;
  }>;
  recommendations?: {
    physicianReview?: string;
    repeatTesting?: string;
    lifestyleChanges?: string[];
    dietaryAdvice?: string[];
    medicationsToDiscuss?: string[];
    emergencyWarningSigns?: string[];
  };
  timelineEvent?: {
    date: string;
    category: string;
    details: string;
    highlights?: string[];
    riskLevel?: "High" | "Moderate" | "Low" | string;
  };
  extractedText?: string;
  summary?: string;
  concerns?: string[];
  nextSteps?: string[];
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  ip: string;
  details: string;
}

export interface AdminStats {
  usersCount: number;
  doctorsCount: number;
  hospitalsCount: number;
  appointmentsCount: number;
  medicineOrdersCount: number;
  labBookingsCount: number;
  totalRevenue: number;
  auditLogs: AuditLog[];
  appointments: Appointment[];
  familyMembers: FamilyMember[];
  medicalTimeline: TimelineRecord[];
}

export interface ABHAIdentity {
  id: string;
  patientId: string;
  abhaNumber: string;
  abhaAddress: string;
  mobile: string;
  linkedAt: string;
  verified: boolean;
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
}

export interface ConsentRecord {
  id: string;
  patientId: string;
  abhaAddress: string;
  hiuId: string;
  hipId: string;
  hipName: string;
  purpose: string;
  consentExpiry: string;
  status: "GRANTED" | "REVOKED" | "EXPIRED" | "REQUESTED";
  dataTypes: string[];
  createdAt: string;
  grantedAt?: string;
}

export interface ImportSession {
  id: string;
  patientId: string;
  consentId: string;
  hipId: string;
  hipName: string;
  status: "PENDING" | "AUTHENTICATING" | "FETCHING_METADATA" | "DECRYPTING" | "PARSING" | "COMPLETED" | "FAILED";
  progress: number;
  error?: string;
  createdAt: string;
}

export interface ImportedHealthRecord {
  id: string;
  patientId: string;
  hipId: string;
  hipName: string;
  recordType: string;
  title: string;
  date: string;
  doctorName: string;
  details: string;
  careContextRef: string;
  fhirData?: string;
}

// ==========================================
// ML HEALTH TRAJECTORY FORECASTING TYPES
// ==========================================

export interface BiomarkerReading {
  date: string;
  value: number;
  unit: string;
  source: string;
  context?: string;
  status: "Normal" | "Elevated" | "High" | "Critical" | "Low";
}

export interface ForecastPoint {
  date: string;
  daysAhead: number;
  value: number;
  confidenceLow: number;
  confidenceHigh: number;
}

export interface BiomarkerTrajectory {
  markerKey: "hba1c" | "fasting_glucose" | "systolic_bp" | "diastolic_bp" | "ldl_cholesterol" | "total_cholesterol" | "bmi" | string;
  markerName: string;
  unit: string;
  historicalReadings: BiomarkerReading[];
  currentValue: number;
  trendDirection: "RISING" | "FALLING" | "STABLE";
  velocityPerMonth: number;
  forecast30Days: ForecastPoint;
  forecast60Days: ForecastPoint;
  forecast90Days: ForecastPoint;
  allForecastPoints: ForecastPoint[];
  projectedRiskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  riskProbability: number; // 0 to 1
  clinicalTarget: { min?: number; max?: number; optimal: string };
  trajectoryAlert: string | null;
  modelDetails: {
    algorithm: "HoltLinearTrend" | "PolynomialRegression" | "ExponentialSmoothing" | "WeightedMovingAverage";
    rSquared: number;
    standardError: number;
    slope: number;
    confidenceBandPercent: number;
  };
  clinicalNarrative?: string;
}

export interface HealthTrajectoryReport {
  patientId: string;
  patientName: string;
  generatedAt: string;
  overallCardiometabolicRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  riskScore: number; // 0-100
  trajectories: BiomarkerTrajectory[];
  criticalAlerts: string[];
  geminiSynthesis?: {
    summary: string;
    clinicalImpression: string;
    preventiveActions: string[];
    monitoringSchedule: string;
  };
}

// ==========================================
// ML RECORD RECONCILIATION & DEDUPLICATION TYPES
// ==========================================

export interface ExtractedMedication {
  id: string;
  rawText: string;
  drugName: string;
  activeIngredient: string;
  brandName?: string;
  genericName: string;
  strength: string;
  normalizedDosageMg: number;
  frequency: string;
  route: string;
  prescribedDate: string;
  prescribingDoctor: string;
  facility: string;
  sourceRecordId: string;
  sourceType: "HealthTribe" | "ABHA";
  careContextRef?: string;
  therapeuticClass: string;
  status: "ACTIVE" | "DISCONTINUED" | "RECONCILED";
  sourceRecords?: ExtractedMedication[];
  matchReason?: string;
}

export interface DuplicateConflictGroup {
  conflictId: string;
  conflictType: "EXACT_DUPLICATE" | "BRAND_GENERIC_DUPLICATE" | "SAME_CLASS_OVERLAP" | "DOSAGE_DISCREPANCY" | "FREQUENCY_CONFLICT";
  similarityScore: number; // 0.0 to 1.0 (from Jaro-Winkler, Levenshtein, Token similarity)
  matchConfidence: number; // 0 to 100 percentage
  activeMolecule: string;
  therapeuticClass: string;
  primaryMedication: ExtractedMedication;
  conflictingMedications: ExtractedMedication[];
  clinicalRiskSeverity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  clinicalRiskDescription: string;
  suggestedResolution: "MERGE_AND_MAINTAIN_LATEST" | "SELECT_SINGLE_BRAND" | "REDUCE_DOSAGE" | "FLAG_FOR_DOCTOR";
  resolutionStatus: "UNRESOLVED" | "RESOLVED_MERGED" | "RESOLVED_KEPT_PRIMARY" | "RESOLVED_DISMISSED";
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface ReconciliationReport {
  id: string;
  patientId: string;
  timestamp: string;
  totalRecordsEvaluated: number;
  totalMedicationsFound: number;
  duplicatesDetectedCount: number;
  conflicts: DuplicateConflictGroup[];
  reconciledMasterList: ExtractedMedication[];
  safetySummary: {
    duplicateRiskCount: number;
    classOverlapCount: number;
    overallSafetyScore: number; // 0 to 100
  };
  geminiExplanation?: {
    clinicalSummary: string;
    doctorActionItems: string[];
    patientGuidance: string;
  };
}

