import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, Upload, ShieldCheck, Stethoscope, Building2, 
  Calendar, ShoppingBag, Plus, Sparkles, AlertTriangle, AlertCircle, 
  CheckCircle2, ArrowRight, Clock, MapPin, Search, Filter,
  FlaskConical, RefreshCw, Layers, ChevronRight, Eye, Info
} from "lucide-react";
import { 
  Prescription, PrescriptionMedicineItem, PharmacyOption, 
  PrescriptionCartItem, FamilyMember, LabTest, UserAddress, ReconciliationReport 
} from "../types";
import { PrescriptionReviewModal } from "./PrescriptionReviewModal";
import { PrescriptionDetailsModal } from "./PrescriptionDetailsModal";
import { PharmacySelectorModal } from "./PharmacySelectorModal";
import { PrescriptionCartDrawer } from "./PrescriptionCartDrawer";
import { MedicationReconciliationCard } from "./MedicationReconciliationCard";

interface PharmacyPrescriptionHubProps {
  activePatient: FamilyMember | null;
  familyMembers: FamilyMember[];
  onSelectPatient: (patient: FamilyMember) => void;
  triggerToast: (message: string, isError?: boolean) => void;
  addresses?: UserAddress[];
  selectedAddress?: UserAddress;
  onSelectAddress?: (addr: UserAddress) => void;
  onOpenInteractionChecker?: (drugNames?: string[]) => void;
  onOpenDietPlanner?: () => void;
}

export const PharmacyPrescriptionHub: React.FC<PharmacyPrescriptionHubProps> = ({
  activePatient,
  familyMembers,
  onSelectPatient,
  triggerToast,
  addresses = [],
  selectedAddress,
  onSelectAddress,
  onOpenInteractionChecker,
  onOpenDietPlanner
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"prescriptions" | "upload" | "reconcile" | "labs" | "nutrition">("prescriptions");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [reconciliationReport, setReconciliationReport] = useState<ReconciliationReport | null>(null);

  // Cart State (Prescription-driven)
  const [prescriptionCart, setPrescriptionCart] = useState<PrescriptionCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modal States
  const [selectedPrescriptionForDetails, setSelectedPrescriptionForDetails] = useState<Prescription | null>(null);
  const [selectedPrescriptionForFulfill, setSelectedPrescriptionForFulfill] = useState<Prescription | null>(null);
  const [isPharmacySelectorOpen, setIsPharmacySelectorOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [extractedOcrData, setExtractedOcrData] = useState<any>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isSubmittingFulfill, setIsSubmittingFulfill] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Physical Upload / Scanner State
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; data: string; mimeType: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [customTextInput, setCustomTextInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const patientId = activePatient ? activePatient.id : "fam-self";

  // Fetch prescriptions, pharmacies, and labs on mount and when patient changes
  useEffect(() => {
    loadPrescriptionHubData();
  }, [patientId]);

  const loadPrescriptionHubData = async () => {
    setLoading(true);
    try {
      const headers = { "x-active-profile-id": patientId };

      const [rxRes, pharmRes, labRes, reconRes] = await Promise.all([
        fetch(`/api/v1/prescriptions?patientId=${patientId}`, { headers }),
        fetch("/api/v1/pharmacies", { headers }),
        fetch("/api/labs", { headers }),
        fetch(`/api/v1/prescriptions/reconciliation-summary?patientId=${patientId}`, { headers })
      ]);

      const rxData = await rxRes.json();
      if (rxData.success && rxData.prescriptions) {
        setPrescriptions(rxData.prescriptions);
      }

      const pharmData = await pharmRes.json();
      if (pharmData.success && pharmData.pharmacies) {
        setPharmacies(pharmData.pharmacies);
      }

      const labData = await labRes.json();
      if (labData.tests) {
        setLabTests(labData.tests);
      }

      const reconData = await reconRes.json();
      if (reconData.success && reconData.report) {
        setReconciliationReport(reconData.report);
      }
    } catch (err) {
      console.error("Failed to load prescription hub data:", err);
      triggerToast("Failed to load prescriptions. Please retry.", true);
    } finally {
      setLoading(false);
    }
  };

  // OCR Extraction Handler
  const handleRunOcr = async (payload: { sampleType?: string; customText?: string; imageBase64?: string; fileName?: string }) => {
    setIsOcrProcessing(true);
    try {
      const res = await fetch("/api/v1/prescriptions/upload-ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-active-profile-id": patientId
        },
        body: JSON.stringify({
          ...payload,
          patientId
        })
      });
      const data = await res.json();
      if (data.success && data.extraction) {
        setExtractedOcrData(data.extraction);
        setIsReviewModalOpen(true);
        triggerToast("Prescription scan detected. Please review extracted credentials and medications.");
      } else {
        triggerToast(data.error || "OCR extraction failed.", true);
      }
    } catch (err) {
      triggerToast("Error processing physical prescription scan.", true);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Confirm Extracted Prescription
  const handleConfirmExtractedPrescription = async (confirmedData: any) => {
    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/v1/prescriptions/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-active-profile-id": patientId
        },
        body: JSON.stringify({
          ...confirmedData,
          patientId
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(data.message || "Prescription verified and registered.");
        setIsReviewModalOpen(false);
        setExtractedOcrData(null);
        setUploadedFile(null);
        setCustomTextInput("");
        loadPrescriptionHubData();
        setActiveSubTab("prescriptions");
      } else {
        triggerToast(data.error || "Failed to confirm prescription.", true);
      }
    } catch (err) {
      triggerToast("Failed to save prescription.", true);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Start Pharmacy Selection for a Prescription
  const handleStartFulfill = (prescription: Prescription) => {
    setSelectedPrescriptionForFulfill(prescription);
    setIsPharmacySelectorOpen(true);
  };

  // Add Prescription to Fulfillment Cart
  const handleConfirmPharmacySelection = (
    prescription: Prescription,
    pharmacy: PharmacyOption,
    fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP"
  ) => {
    const newCartItems: PrescriptionCartItem[] = prescription.medications.map(med => ({
      prescriptionId: prescription.id,
      prescriptionCode: prescription.id,
      prescriptionStatus: prescription.status,
      doctorName: prescription.doctorName,
      hospital: prescription.hospital,
      medicine: med,
      quantity: med.quantity || 30,
      pharmacy,
      fulfillmentType,
      unitPrice: 0 // Dispensing via partner pharmacy
    }));

    setPrescriptionCart([...prescriptionCart, ...newCartItems]);
    triggerToast(`Added ${prescription.medications.length} prescription items to fulfill via ${pharmacy.name}.`);
    setIsCartOpen(true);
  };

  // Final Checkout Fulfillment
  const handleCheckoutFulfillment = async (deliveryDetails: any) => {
    if (prescriptionCart.length === 0) return;
    setIsSubmittingFulfill(true);
    try {
      const firstItem = prescriptionCart[0];
      const res = await fetch("/api/v1/prescriptions/fulfill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-active-profile-id": patientId
        },
        body: JSON.stringify({
          prescriptionId: firstItem.prescriptionId,
          items: prescriptionCart.map(item => ({
            name: item.medicine.name,
            strength: item.medicine.strength,
            quantity: item.quantity,
            pharmacy: item.pharmacy.name
          })),
          pharmacyId: firstItem.pharmacy.id,
          fulfillmentType: firstItem.fulfillmentType,
          deliveryAddress: deliveryDetails.address,
          notes: deliveryDetails.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Prescription fulfillment request sent to licensed pharmacist.");
        setPrescriptionCart([]);
        setIsCartOpen(false);
        loadPrescriptionHubData();
      } else {
        triggerToast(data.error || "Failed to process fulfillment.", true);
      }
    } catch (err) {
      triggerToast("Error processing pharmacy fulfillment.", true);
    } finally {
      setIsSubmittingFulfill(false);
    }
  };

  // Filter Prescriptions
  const filteredPrescriptions = prescriptions.filter(p => {
    const matchesSearch = 
      p.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.medications.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "ALL") return true;
    if (statusFilter === "VERIFIED") return p.status === "VERIFIED";
    if (statusFilter === "REQUIRES_REVIEW") return p.status === "REQUIRES_REVIEW" || p.status === "PENDING_VERIFICATION";
    if (statusFilter === "FULFILLED") return p.status === "FULFILLED" || p.fulfillmentStatus === "DELIVERED";
    return true;
  });

  return (
    <div id="pharmacy-prescription-hub" className="space-y-6">
      {/* Header Banner - Clinical Blue Design */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-100 border border-blue-400/30">
                Prescription-First Clinical Coordination
              </span>
              <span className="text-[11px] font-semibold text-blue-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ABDM Verified Provenance
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Your Prescriptions & Labs
            </h1>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Prescription-driven fulfillment and diagnostic coordination. HealthTribe operates as an intelligent coordination layer and does not independently recommend, prescribe, or sell medicines.
            </p>

            {/* Active Patient Selector Context */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-blue-200">Prescriptions for:</span>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-xl border border-white/20">
                <span className="text-xs font-bold text-white">
                  {activePatient ? activePatient.name : "Supriya Kilari"}
                </span>
                {familyMembers.length > 1 && (
                  <select
                    value={patientId}
                    onChange={(e) => {
                      const selected = familyMembers.find(m => m.id === e.target.value);
                      if (selected) onSelectPatient(selected);
                    }}
                    className="bg-transparent text-xs text-blue-200 focus:outline-none cursor-pointer"
                  >
                    {familyMembers.map(m => (
                      <option key={m.id} value={m.id} className="text-slate-900">
                        {m.name} ({m.relation})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab("upload")}
              className="px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-700" />
              Upload Physical Prescription
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("reconcile")}
              className="px-4 py-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 border border-blue-400/40 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-blue-200" />
              Cross-Hospital Reconciliation
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-950 border border-indigo-400/30 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer relative"
            >
              <ShoppingBag className="w-4 h-4 text-indigo-300" />
              <span>Prescription Basket</span>
              {prescriptionCart.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {prescriptionCart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            onClick={() => setActiveSubTab("prescriptions")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === "prescriptions"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Your Prescriptions ({prescriptions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("upload")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === "upload"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Scan Physical Script
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("reconcile")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === "reconcile"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Medication Reconciliation
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("labs")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === "labs"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Diagnostic Labs ({labTests.length})
          </button>
        </div>

        {/* Clinical Safety Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Zero Commercial Bias • Prescriptions Required</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-VIEW 1: YOUR PRESCRIPTIONS (DEFAULT) */}
      {/* ========================================================= */}
      {activeSubTab === "prescriptions" && (
        <div className="space-y-5">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctor, hospital, medicine, Rx code..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <span className="text-[11px] text-slate-500 font-semibold mr-1">Status:</span>
              {[
                { key: "ALL", label: "All Records" },
                { key: "VERIFIED", label: "✓ Verified" },
                { key: "REQUIRES_REVIEW", label: "⚠ Review Needed" },
                { key: "FULFILLED", label: "Dispensed" }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    statusFilter === tab.key
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prescriptions Cards Grid */}
          {filteredPrescriptions.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No Prescriptions Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Upload a physical prescription or connect your ABHA record to view and fulfill verified clinical medications.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab("upload")}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer"
              >
                + Upload Physical Prescription
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPrescriptions.map((rx) => {
                const isConflictFlag = rx.status === "REQUIRES_REVIEW" || (rx.ocrWarnings && rx.ocrWarnings.length > 0);
                const isFulfilled = rx.status === "FULFILLED" || rx.fulfillmentStatus === "DELIVERED";

                return (
                  <div
                    key={rx.id}
                    className={`p-5 rounded-2xl bg-white dark:bg-slate-800/90 border transition space-y-4 shadow-sm hover:shadow-md ${
                      isConflictFlag
                        ? "border-amber-300 dark:border-amber-800/70 bg-amber-50/20"
                        : "border-slate-200 dark:border-slate-700/80"
                    }`}
                  >
                    {/* Prescription Provenance Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {rx.id.toUpperCase()}
                          </span>

                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            rx.status === "VERIFIED"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : rx.status === "REQUIRES_REVIEW"
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                          }`}>
                            {rx.status === "VERIFIED" ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {rx.verificationBadge || "Prescription Verified"}
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                {rx.verificationBadge || "Requires Clinician Review"}
                              </>
                            )}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-1">
                          <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          {rx.doctorName}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {rx.hospital}
                          {rx.doctorSpecialty && <span className="text-slate-400">• {rx.doctorSpecialty}</span>}
                        </p>
                      </div>

                      <div className="text-right text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />
                          {rx.prescriptionDate}
                        </span>
                        {rx.doctorRegNo && (
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            {rx.doctorRegNo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Conflict or Clinical Discrepancy Banner */}
                    {isConflictFlag && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Potential Prescription Conflict / Ambiguity</span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-amber-200/90 leading-relaxed">
                          {rx.notes || "Two prescriptions contain different strengths or dosage specifications. Clinician verification recommended before dispensing."}
                        </p>
                      </div>
                    )}

                    {/* Prescribed Medications Box */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Prescribed Medications ({rx.medications.length})
                      </span>

                      <div className="space-y-1.5">
                        {rx.medications.map((med, i) => (
                          <div 
                            key={med.id || i}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white">{med.name}</span>
                                {med.strength && (
                                  <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 px-1.5 py-0.2 rounded">
                                    {med.strength}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {med.frequency} • {med.duration}
                              </p>
                            </div>

                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                              Qty: {med.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPrescriptionForDetails(rx)}
                        className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Prescription
                      </button>

                      <div className="flex items-center gap-2">
                        {onOpenInteractionChecker && (
                          <button
                            type="button"
                            onClick={() => onOpenInteractionChecker(rx.medications.map(m => m.name))}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                            title="Check drug-drug interactions"
                          >
                            Check Interactions
                          </button>
                        )}

                        {!isFulfilled && (
                          <button
                            type="button"
                            onClick={() => handleStartFulfill(rx)}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center gap-1.5"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Find Pharmacy
                          </button>
                        )}
                        {isFulfilled && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Dispensed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 2: PHYSICAL PRESCRIPTION OCR SCANNER */}
      {/* ========================================================= */}
      {activeSubTab === "upload" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  Physical Prescription AI OCR
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  Upload & Scan Physical Doctor's Prescription
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                  Upload a photo or scanned copy of your doctor's handwritten or printed prescription. Our clinical AI extracts doctor credentials and medications for your review.
                </p>
              </div>
            </div>

            {/* Critical Safety Notice */}
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-950 dark:text-blue-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-blue-900 dark:text-blue-300">
                  Strict Clinical Safety Protocol
                </p>
                <p className="text-slate-600 dark:text-blue-200/90 leading-relaxed">
                  HealthTribe OCR engines NEVER silently guess unclear handwriting. Any ambiguous dosage or medication name is flagged for patient review and licensed pharmacist confirmation before dispensing.
                </p>
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  const file = files[0];
                  const reader = new FileReader();
                  reader.onload = () => {
                    setUploadedFile({
                      name: file.name,
                      size: file.size,
                      data: reader.result as string,
                      mimeType: file.type
                    });
                    handleRunOcr({
                      fileName: file.name,
                      imageBase64: reader.result as string
                    });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${
                isDragging
                  ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/30"
                  : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-blue-400"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    const file = files[0];
                    const reader = new FileReader();
                    reader.onload = () => {
                      setUploadedFile({
                        name: file.name,
                        size: file.size,
                        data: reader.result as string,
                        mimeType: file.type
                      });
                      handleRunOcr({
                        fileName: file.name,
                        imageBase64: reader.result as string
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />

              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {uploadedFile ? uploadedFile.name : "Drag & Drop Prescription Slip (PNG, JPG, PDF)"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Supports clear mobile camera snapshots or scanned hospital discharge scripts
                </p>
                <button
                  type="button"
                  disabled={isOcrProcessing}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                  {isOcrProcessing ? "Scanning Prescription..." : "Select File to Upload"}
                </button>
              </div>
            </div>

            {/* Quick Testing Presets for Physical Prescriptions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Or Test with Verified Prescription Presets:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isOcrProcessing}
                  onClick={() => handleRunOcr({ sampleType: "handwritten_clinic" })}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-left hover:border-blue-500 transition cursor-pointer flex items-start gap-3"
                >
                  <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Dr. Mehta Endocrinology Prescription (High Confidence)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Extracts Metformin 500mg + Telmisartan 40mg with clear doctor registration provenance.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isOcrProcessing}
                  onClick={() => handleRunOcr({ sampleType: "unclear_handwriting" })}
                  className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/20 text-left hover:border-amber-500 transition cursor-pointer flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      City Polyclinic Slip (Tests Ambiguity Safeguard)
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-amber-200/80 mt-0.5">
                      Surfaces safety warning on smudged handwriting line without silently guessing dosage.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 3: MEDICATION RECONCILIATION INTEGRATION */}
      {/* ========================================================= */}
      {activeSubTab === "reconcile" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  ML Brand-to-Generic Entity Resolution
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  Unified Medication View & Cross-Hospital Overlap
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                  Patients often consult multiple doctors across different hospital chains (e.g. Apollo, Fortis, Lifespan), leading to brand duplications (Metformin vs Glycomet vs Glucophage) or dosage conflicts.
                </p>
              </div>
            </div>

            {/* Reconciliation Card Component */}
            {reconciliationReport ? (
              <MedicationReconciliationCard
                report={reconciliationReport}
                onResolve={(groupId, resolution, notes) => {
                  triggerToast(`Resolution applied for group ${groupId}: ${resolution}`);
                  loadPrescriptionHubData();
                }}
              />
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                Loading medication reconciliation data across timeline records...
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 4: DIAGNOSTIC LABS */}
      {/* ========================================================= */}
      {activeSubTab === "labs" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Physician-Prescribed Diagnostic Tests
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Home sample collection by NABL-accredited diagnostic partner laboratories
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {labTests.map((test) => (
              <div
                key={test.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {test.tags && test.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {test.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {test.description}
                  </p>

                  <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg">
                    <span className="font-semibold">Preparation:</span> {test.preparation}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">₹{test.price}</span>
                    {test.originalPrice && (
                      <span className="text-xs text-slate-400 line-through ml-1.5">₹{test.originalPrice}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/labs/book", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "x-active-profile-id": patientId },
                          body: JSON.stringify({
                            testId: test.id,
                            patientId,
                            date: new Date().toISOString().split("T")[0],
                            slot: "07:30 AM - 08:30 AM (Fasting)"
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          triggerToast(`Home collection booked for ${test.name}. Confirmation sent.`);
                        }
                      } catch (err) {
                        triggerToast("Lab booking failure.", true);
                      }
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition cursor-pointer"
                  >
                    Book Home Visit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS & DRAWERS */}
      {/* ========================================================= */}

      {/* Prescription Details Modal */}
      <PrescriptionDetailsModal
        isOpen={!!selectedPrescriptionForDetails}
        onClose={() => setSelectedPrescriptionForDetails(null)}
        prescription={selectedPrescriptionForDetails}
        onFulfill={handleStartFulfill}
      />

      {/* Pharmacy Selector Modal */}
      <PharmacySelectorModal
        isOpen={isPharmacySelectorOpen}
        onClose={() => setIsPharmacySelectorOpen(false)}
        prescription={selectedPrescriptionForFulfill}
        pharmacies={pharmacies}
        onConfirmFulfillment={handleConfirmPharmacySelection}
      />

      {/* Review Modal for Extracted Physical Prescriptions */}
      {extractedOcrData && (
        <PrescriptionReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          initialData={extractedOcrData}
          onConfirm={handleConfirmExtractedPrescription}
          isSubmitting={isSubmittingReview}
        />
      )}

      {/* Prescription Cart Drawer */}
      <PrescriptionCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={prescriptionCart}
        onRemoveItem={(idx) => setPrescriptionCart(prescriptionCart.filter((_, i) => i !== idx))}
        onClearCart={() => setPrescriptionCart([])}
        onCheckout={handleCheckoutFulfillment}
        isSubmitting={isSubmittingFulfill}
        addresses={addresses}
        selectedAddress={selectedAddress}
        onSelectAddress={onSelectAddress}
      />
    </div>
  );
};
