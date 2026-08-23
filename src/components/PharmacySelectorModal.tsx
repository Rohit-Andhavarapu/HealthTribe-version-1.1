import React, { useState } from "react";
import { 
  Building2, MapPin, Truck, Store, Star, ShieldCheck, 
  Clock, CheckCircle2, ArrowRight
} from "lucide-react";
import { Prescription, PharmacyOption } from "../types";

interface PharmacySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription | null;
  pharmacies: PharmacyOption[];
  onConfirmFulfillment: (prescription: Prescription, pharmacy: PharmacyOption, fulfillmentType: "HOME_DELIVERY" | "STORE_PICKUP") => void;
}

export const PharmacySelectorModal: React.FC<PharmacySelectorModalProps> = ({
  isOpen,
  onClose,
  prescription,
  pharmacies,
  onConfirmFulfillment
}) => {
  if (!isOpen || !prescription) return null;

  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>(
    pharmacies.length > 0 ? pharmacies[0].id : ""
  );
  const [fulfillmentType, setFulfillmentType] = useState<"HOME_DELIVERY" | "STORE_PICKUP">("HOME_DELIVERY");

  const selectedPharmacy = pharmacies.find(p => p.id === selectedPharmacyId) || pharmacies[0];

  const handleProceed = () => {
    if (!selectedPharmacy) return;
    onConfirmFulfillment(prescription, selectedPharmacy, fulfillmentType);
    onClose();
  };

  return (
    <div id="pharmacy-selector-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div id="pharmacy-selector-modal" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full my-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-100 border border-blue-400/30">
                Prescription Fulfillment
              </span>
              <span className="text-[11px] font-mono bg-white/20 px-2 py-0.5 rounded text-white font-bold">
                {prescription.id.toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5">Choose Fulfilling Pharmacy</h2>
            <p className="text-xs text-blue-200">
              Select a licensed pharmacy partner. A registered pharmacist verifies your script before dispatch.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Summary of Prescribed Medicines */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block mb-1.5">
              Prescription Items to Dispense ({prescription.medications.length} items)
            </span>
            <div className="flex flex-wrap gap-2">
              {prescription.medications.map((m, idx) => (
                <div key={idx} className="text-xs bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-sm">
                  <span className="font-bold text-slate-900 dark:text-white">{m.name}</span>
                  <span className="text-slate-400">({m.quantity} units)</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Prescribed by: <span className="font-semibold text-slate-700 dark:text-slate-200">{prescription.doctorName}</span> • {prescription.hospital}
            </div>
          </div>

          {/* Fulfillment Mode Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Fulfillment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentType("HOME_DELIVERY")}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                  fulfillmentType === "HOME_DELIVERY"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                <Truck className={`w-5 h-5 mt-0.5 ${fulfillmentType === "HOME_DELIVERY" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                <div>
                  <p className="text-xs font-bold">Home Delivery</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Cold-chain dispatch directly to your doorstep</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType("STORE_PICKUP")}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                  fulfillmentType === "STORE_PICKUP"
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                <Store className={`w-5 h-5 mt-0.5 ${fulfillmentType === "STORE_PICKUP" ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                <div>
                  <p className="text-xs font-bold">Pharmacy Pickup</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ready for pickup at counter in 15–20 mins</p>
                </div>
              </button>
            </div>
          </div>

          {/* Licensed Pharmacies List */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Verified Partner Pharmacies Nearby
            </label>

            <div className="space-y-2.5">
              {pharmacies.map((pharm) => {
                const isSelected = selectedPharmacyId === pharm.id;
                return (
                  <div
                    key={pharm.id}
                    onClick={() => setSelectedPharmacyId(pharm.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {pharm.name}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Licensed
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{pharm.branch} • {pharm.address}</p>

                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-500" />
                            {pharm.distanceKm} km away
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {pharm.deliveryTimeEstimate}
                          </span>
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {pharm.rating}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <input
                        type="radio"
                        name="pharmacy-select"
                        checked={isSelected}
                        onChange={() => setSelectedPharmacyId(pharm.id)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        Stock: {pharm.inStockCompliancePercent}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinical Governance Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>HealthTribe acts as the secure clinical coordination layer and does not prescribe or independently sell medications.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleProceed}
            className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer"
          >
            <span>Add to Prescription Cart</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
