import React, { useState } from "react";
import { 
  ShoppingBag, Trash2, ShieldCheck, Truck, Store, 
  Building2, Stethoscope, ArrowRight, CheckCircle2, AlertCircle, FileText
} from "lucide-react";
import { PrescriptionCartItem, UserAddress } from "../types";

interface PrescriptionCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: PrescriptionCartItem[];
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onCheckout: (deliveryDetails: any) => void;
  isSubmitting?: boolean;
  addresses?: UserAddress[];
  selectedAddress?: UserAddress;
  onSelectAddress?: (addr: UserAddress) => void;
}

export const PrescriptionCartDrawer: React.FC<PrescriptionCartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isSubmitting = false,
  addresses = [],
  selectedAddress,
  onSelectAddress
}) => {
  if (!isOpen) return null;

  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [pharmacistAcknowledged, setPharmacistAcknowledged] = useState(true);

  // Group cart items by prescription
  const totalMedicationsCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const handleConfirmFulfillment = () => {
    if (cartItems.length === 0) return;
    onCheckout({
      notes: deliveryNotes,
      address: selectedAddress ? `${selectedAddress.house}, ${selectedAddress.area}, ${selectedAddress.city} - ${selectedAddress.pincode}` : "Default Patient Address"
    });
  };

  return (
    <div id="prescription-cart-drawer-backdrop" className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div id="prescription-cart-drawer" className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShoppingBag className="w-6 h-6 text-blue-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-100 border border-blue-400/30">
                  Prescription Fulfillment
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-bold">
                  {cartItems.length} {cartItems.length === 1 ? "Order" : "Orders"}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">Prescription Dispense Basket</h2>
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 mx-auto flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No Prescriptions in Basket
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Select your verified doctor prescription from the "Your Prescriptions" list and choose a partner pharmacy to dispense.
              </p>
            </div>
          ) : (
            <>
              {/* Prescription Items List */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Prescribed Items ({cartItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-700 cursor-pointer"
                  >
                    Clear Basket
                  </button>
                </div>

                {cartItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 space-y-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded">
                            {item.prescriptionCode.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {item.medicine.name}
                        </h4>
                        {item.medicine.strength && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Strength: {item.medicine.strength} • Frequency: {item.medicine.frequency}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition cursor-pointer"
                        title="Remove from basket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Prescribing Doctor & Hospital Provenance */}
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                        <span>{item.doctorName} • {item.hospital}</span>
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Qty: {item.quantity}
                      </span>
                    </div>

                    {/* Fulfilling Pharmacy & Delivery Method */}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.pharmacy.name} ({item.pharmacy.branch})</span>
                      </div>
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                        {item.fulfillmentType === "STORE_PICKUP" ? (
                          <>
                            <Store className="w-3 h-3" /> Pickup in 15m
                          </>
                        ) : (
                          <>
                            <Truck className="w-3 h-3" /> {item.pharmacy.deliveryTimeEstimate}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Address Context */}
              {selectedAddress && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Delivery Destination
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {selectedAddress.fullName} • {selectedAddress.mobile}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {selectedAddress.house}, {selectedAddress.area}, {selectedAddress.city} - {selectedAddress.pincode}
                  </p>
                </div>
              )}

              {/* Pharmacist Clinical Review Affirmation */}
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-950 dark:text-blue-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Licensed Pharmacist Verification Gate</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700 dark:text-blue-200">
                  A registered clinical pharmacist at the selected partner pharmacy will inspect and verify your doctor's official prescription before packaging and dispensing.
                </p>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Patient Notes for Pharmacist / Courier (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Ring doorbell, leave at security gate"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {cartItems.length > 0 && (
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Fulfillment Coordination Fee</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹0 (Included)</span>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmFulfillment}
              className="w-full py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              {isSubmitting ? "Submitting to Pharmacist..." : "Confirm & Request Pharmacy Dispense"}
            </button>

            <p className="text-[10px] text-center text-slate-400">
              Prescription provenance and verification logs are cryptographically sealed in your health timeline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
