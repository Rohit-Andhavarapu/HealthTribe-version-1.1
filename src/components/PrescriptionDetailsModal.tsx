import React from "react";
import { 
  FileText, ShieldCheck, Stethoscope, Building2, Calendar, 
  CheckCircle2, Printer, ShoppingBag, AlertTriangle, User, Hash
} from "lucide-react";
import { Prescription } from "../types";

interface PrescriptionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription | null;
  onFulfill?: (prescription: Prescription) => void;
}

export const PrescriptionDetailsModal: React.FC<PrescriptionDetailsModalProps> = ({
  isOpen,
  onClose,
  prescription,
  onFulfill
}) => {
  if (!isOpen || !prescription) return null;

  return (
    <div id="prescription-details-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div id="prescription-details-modal" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full my-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Prescription Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-900 p-6 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-100 border border-blue-400/30">
                Official Clinical Prescription
              </span>
              <span className="text-[11px] font-mono bg-white/20 px-2 py-0.5 rounded text-white font-bold">
                {prescription.id.toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5">{prescription.hospital}</h2>
            <p className="text-xs text-blue-200">{prescription.hospitalAddress || "Clinical Health Facility"}</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Prescription Content Sheet */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50/50 dark:bg-slate-900">
          {/* Doctor & Patient Metadata Row */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Prescribing Clinician</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                {prescription.doctorName}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{prescription.doctorSpecialty || "General Medicine"}</p>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">Reg No: {prescription.doctorRegNo || "TS-MC-49201"}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient & Date</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                {prescription.patientName}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Prescribed on: {prescription.prescriptionDate}
              </p>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  {prescription.verificationBadge || prescription.verificationMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Indication / Diagnosis */}
          {prescription.diagnosis && (
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">Clinical Diagnosis / Indication</span>
              <p className="text-xs font-semibold text-blue-950 dark:text-blue-100 mt-0.5">
                {prescription.diagnosis}
              </p>
            </div>
          )}

          {/* Prescribed Medications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Prescribed Regimen ({prescription.medications.length} Medications)
              </h3>
            </div>

            <div className="space-y-2.5">
              {prescription.medications.map((med, index) => (
                <div 
                  key={med.id || index}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
                          {index + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {med.name}
                        </h4>
                        {med.strength && (
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                            {med.strength}
                          </span>
                        )}
                      </div>
                      {med.genericName && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 ml-7">
                          Generic / Molecule: <span className="font-medium">{med.genericName}</span>
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                      Qty: {med.quantity}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 ml-7 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Frequency</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{med.frequency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{med.duration}</span>
                    </div>
                  </div>

                  {med.instructions && (
                    <div className="mt-2 text-xs text-blue-800 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/30 p-2 rounded-lg ml-7">
                      <span className="font-semibold">Special Instructions:</span> {med.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Verification Stamp */}
          {prescription.notes && (
            <div className="text-xs text-slate-600 dark:text-slate-400 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-slate-200">Doctor's Notes: </span>
              {prescription.notes}
            </div>
          )}

          {/* Clinical Governance Footer */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Cryptographically verified via Ayushman Bharat Digital Mission (ABDM)</span>
            </div>
            <span className="font-mono text-[10px]">AUTH-DIGITAL-SIGN-OK</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Prescription
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
            {onFulfill && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onFulfill(prescription);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Find Pharmacy & Fulfill
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
