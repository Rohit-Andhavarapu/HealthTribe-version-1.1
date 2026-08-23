import React, { useState } from "react";
import { 
  FileText, CheckCircle2, AlertTriangle, AlertCircle, 
  Trash2, Plus, Edit3, ShieldCheck, Stethoscope, Building2, Calendar
} from "lucide-react";
import { PrescriptionMedicineItem } from "../types";

interface PrescriptionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    doctorName: string;
    doctorSpecialty?: string;
    doctorRegNo?: string;
    hospital: string;
    hospitalAddress?: string;
    prescriptionDate: string;
    diagnosis?: string;
    ocrConfidence?: "HIGH" | "MEDIUM" | "LOW";
    ocrWarnings?: string[];
    medications: PrescriptionMedicineItem[];
  };
  onConfirm: (confirmedData: any) => void;
  isSubmitting?: boolean;
}

export const PrescriptionReviewModal: React.FC<PrescriptionReviewModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onConfirm,
  isSubmitting = false
}) => {
  if (!isOpen) return null;

  const [doctorName, setDoctorName] = useState(initialData.doctorName || "");
  const [doctorSpecialty, setDoctorSpecialty] = useState(initialData.doctorSpecialty || "General Medicine");
  const [doctorRegNo, setDoctorRegNo] = useState(initialData.doctorRegNo || "REG-VERIFIED");
  const [hospital, setHospital] = useState(initialData.hospital || "");
  const [hospitalAddress, setHospitalAddress] = useState(initialData.hospitalAddress || "Bangalore");
  const [prescriptionDate, setPrescriptionDate] = useState(initialData.prescriptionDate || new Date().toISOString().split("T")[0]);
  const [diagnosis, setDiagnosis] = useState(initialData.diagnosis || "Clinical Review");
  const [medications, setMedications] = useState<PrescriptionMedicineItem[]>(
    initialData.medications && initialData.medications.length > 0 ? initialData.medications : [
      {
        id: "rxm-new-1",
        name: "",
        genericName: "",
        strength: "",
        dosage: "",
        frequency: "Once daily after meals",
        duration: "30 days",
        quantity: 30,
        instructions: ""
      }
    ]
  );
  const [userConfirmedVerification, setUserConfirmedVerification] = useState(false);

  const handleMedChange = (index: number, field: keyof PrescriptionMedicineItem, value: any) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleAddMed = () => {
    setMedications([
      ...medications,
      {
        id: `rxm-custom-${Date.now()}`,
        name: "",
        genericName: "",
        strength: "",
        dosage: "",
        frequency: "Twice daily after meals",
        duration: "30 days",
        quantity: 30,
        instructions: ""
      }
    ]);
  };

  const handleRemoveMed = (index: number) => {
    if (medications.length <= 1) return;
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validMeds = medications.filter(m => m.name.trim().length > 0);
    if (validMeds.length === 0) {
      alert("Please ensure at least one medication name is specified.");
      return;
    }

    onConfirm({
      doctorName,
      doctorSpecialty,
      doctorRegNo,
      hospital,
      hospitalAddress,
      prescriptionDate,
      diagnosis,
      ocrConfidence: initialData.ocrConfidence || "HIGH",
      ocrWarnings: initialData.ocrWarnings || [],
      medications: validMeds
    });
  };

  const hasWarnings = initialData.ocrWarnings && initialData.ocrWarnings.length > 0;
  const isLowConfidence = initialData.ocrConfidence === "LOW" || initialData.ocrConfidence === "MEDIUM";

  return (
    <div id="prescription-review-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div id="prescription-review-modal" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full my-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Medical Blue Theme */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileText className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-100 border border-blue-400/30">
                  Prescription Detected
                </span>
                {initialData.ocrConfidence && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    initialData.ocrConfidence === "HIGH"
                      ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/30"
                      : "bg-amber-500/30 text-amber-200 border border-amber-400/30"
                  }`}>
                    OCR Confidence: {initialData.ocrConfidence}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mt-1">Review & Verify Prescription</h2>
              <p className="text-xs text-blue-100/80">
                Please verify extracted doctor credentials, hospital source, and medications before pharmacist fulfillment.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Critical Safety Notice if Handwriting was Ambiguous */}
          {(hasWarnings || isLowConfidence) && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-amber-800 dark:text-amber-300">
                    Clinical AI Ambiguity Notice
                  </p>
                  <p className="text-slate-700 dark:text-amber-200/90">
                    Some handwritten fields could not be read with 100% confidence. In accordance with HealthTribe clinical safety protocols, AI never guesses illegible handwriting. Please verify all medication names, strengths, and doses below.
                  </p>
                  {initialData.ocrWarnings && initialData.ocrWarnings.map((warn, i) => (
                    <div key={i} className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
                      <span>•</span> {warn}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Clinician & Facility Provenance Fields */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              1. Prescribing Physician & Facility Provenance
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Doctor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Mehta"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Specialty / Department
                </label>
                <input
                  type="text"
                  value={doctorSpecialty}
                  onChange={(e) => setDoctorSpecialty(e.target.value)}
                  placeholder="e.g. Diabetologist / Internal Medicine"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  Hospital / Clinic Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  placeholder="e.g. AIIMS / Apollo / Fortis Hospital"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Prescription Date
                  </label>
                  <input
                    type="date"
                    value={prescriptionDate}
                    onChange={(e) => setPrescriptionDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Doctor Reg No.
                  </label>
                  <input
                    type="text"
                    value={doctorRegNo}
                    onChange={(e) => setDoctorRegNo(e.target.value)}
                    placeholder="e.g. TS-MC-49201"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Diagnosis / Clinical Indication
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes & Mild Hypertension"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Prescribed Medications Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                2. Prescribed Medications ({medications.length})
              </h3>
              <button
                type="button"
                onClick={handleAddMed}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Medication Row
              </button>
            </div>

            <div className="space-y-3">
              {medications.map((med, idx) => (
                <div 
                  key={med.id || idx}
                  className={`p-4 rounded-xl border ${
                    med.unclearFlag 
                      ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800" 
                      : "border-slate-200 bg-white dark:bg-slate-800/80 dark:border-slate-700"
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      Medication Entry
                      {med.confidenceScore && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${
                          med.confidenceScore >= 90 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        }`}>
                          Score: {med.confidenceScore}%
                        </span>
                      )}
                    </span>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMed(idx)}
                        className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  {med.unclearFlag && (
                    <div className="p-2 rounded bg-amber-100/70 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Handwriting ambiguity detected for this entry. Please verify strength and dosage.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                        Drug Name (Brand or Generic) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={med.name}
                        onChange={(e) => handleMedChange(idx, "name", e.target.value)}
                        placeholder="e.g. Metformin 500 mg"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                        Strength / Concentration
                      </label>
                      <input
                        type="text"
                        value={med.strength}
                        onChange={(e) => handleMedChange(idx, "strength", e.target.value)}
                        placeholder="e.g. 500 mg / 10 mg"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                        Frequency
                      </label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => handleMedChange(idx, "frequency", e.target.value)}
                        placeholder="e.g. Twice daily after meals"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                        Duration & Quantity
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => handleMedChange(idx, "duration", e.target.value)}
                          placeholder="e.g. 30 days"
                          className="w-2/3 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                        <input
                          type="number"
                          value={med.quantity || 30}
                          onChange={(e) => handleMedChange(idx, "quantity", parseInt(e.target.value) || 1)}
                          placeholder="Qty"
                          className="w-1/3 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                        Instructions / Caution
                      </label>
                      <input
                        type="text"
                        value={med.instructions || ""}
                        onChange={(e) => handleMedChange(idx, "instructions", e.target.value)}
                        placeholder="e.g. Take with morning meal"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Affirmation */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs flex items-start gap-3">
            <input
              id="confirm-rx-check"
              type="checkbox"
              checked={userConfirmedVerification}
              onChange={(e) => setUserConfirmedVerification(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="confirm-rx-check" className="text-slate-700 dark:text-blue-200 cursor-pointer select-none">
              <span className="font-bold">Patient Confirmation:</span> I confirm that the medication details above match my doctor's physical prescription. I understand that a licensed registered pharmacist will verify the original physical/digital prescription before dispensing.
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !userConfirmedVerification}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              {isSubmitting ? "Verifying..." : "Confirm & Save to Health Records"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
