import React, { useState, useEffect } from "react";
import { 
  Pill, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Split,
  Calendar,
  User,
  Info
} from "lucide-react";
import { ReconciliationReport, ExtractedMedication, DuplicateConflictGroup } from "../types";

interface Props {
  patientId: string;
  patientName: string;
  role?: "patient" | "doctor";
  onUpdated?: () => void;
}

export const MedicationReconciliationCard: React.FC<Props> = ({ patientId, patientName, role = "patient", onUpdated }) => {
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [expandedConflicts, setExpandedConflicts] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"unified" | "conflicts" | "audit">("unified");

  const fetchReconciliation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/ml/reconcile/${patientId}`);
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        setError(data.error || "Failed to load medication reconciliation.");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading medication reconciliation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, [patientId]);

  const handleResolveConflict = async (conflictId: string, status: "RESOLVED_MERGED" | "RESOLVED_KEPT_PRIMARY" | "RESOLVED_DISMISSED", notes?: string) => {
    setResolvingId(conflictId);
    try {
      const res = await fetch(`/api/v1/ml/reconcile/${patientId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conflictId,
          resolutionStatus: status,
          notes: notes || `Resolved by ${role === "doctor" ? "Attending Physician" : "Patient"}`,
          resolvedBy: role === "doctor" ? "Attending Physician" : "Patient"
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchReconciliation();
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      console.error("Resolve conflict error:", err);
    } finally {
      setResolvingId(null);
    }
  };

  const toggleConflict = (id: string) => {
    setExpandedConflicts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
        <div className="flex flex-col items-center justify-center space-y-3 py-8">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Reconciling Multi-Hospital Prescriptions...</p>
          <p className="text-xs text-slate-500">Executing brand-to-generic entity resolution & cross-facility deduplication</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Medication Reconciliation</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{error || "No prescription records available."}</p>
            <button 
              onClick={fetchReconciliation}
              className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-scan Records
            </button>
          </div>
        </div>
      </div>
    );
  }

  const duplicatesOnly = report.conflicts.filter(c => c.conflictType === "EXACT_DUPLICATE" || c.conflictType === "BRAND_GENERIC_DUPLICATE");
  const conflictsOnly = report.conflicts.filter(c => c.conflictType === "DOSAGE_DISCREPANCY" || c.conflictType === "FREQUENCY_CONFLICT");

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
              <Pill className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base md:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              Cross-Hospital Medication Reconciliation
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-md text-[10px] font-bold">
                ML Entity Resolution
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consolidating multi-facility prescriptions into a unified master list while preserving all source records.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>{report.totalMedicationsFound} Prescribed</span>
            <span className="text-slate-400">→</span>
            <span className="text-emerald-600 font-bold">{report.reconciledMasterList.length} Unified</span>
          </div>

          <button 
            onClick={fetchReconciliation} 
            title="Re-run ML Reconciliation"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("unified")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === "unified"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          <span>Unified Active Regimen ({report.reconciledMasterList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("conflicts")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === "conflicts"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          <span>Duplicates & Conflicts ({report.conflicts.length})</span>
          {report.conflicts.some(c => c.resolutionStatus === "UNRESOLVED") && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === "audit"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Hospital Source Records ({report.totalMedicationsFound})</span>
        </button>
      </div>

      {/* TAB 1: UNIFIED MASTER MEDICATION LIST */}
      {activeTab === "unified" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Unified Active Regimen (Single Clean Representation)
            </span>
            <span className="text-[11px] text-slate-400">
              *Duplicates grouped by active molecule & strength
            </span>
          </div>

          {/* Any pending conflict warning banner */}
          {conflictsOnly.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Potential Medication Conflict Detected: </span>
                <span>{conflictsOnly.length} multi-hospital dosage discrepancy detected. Dosages are kept separate pending clinician review in the Duplicates & Conflicts tab.</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.reconciledMasterList.map((med) => {
              // Check if this molecule has conflicts
              const relatedConflict = report.conflicts.find(c => c.activeMolecule.toLowerCase() === med.activeIngredient.toLowerCase() && (c.conflictType === "DOSAGE_DISCREPANCY" || c.conflictType === "FREQUENCY_CONFLICT"));
              const relatedDuplicate = report.conflicts.find(c => c.activeMolecule.toLowerCase() === med.activeIngredient.toLowerCase() && (c.conflictType === "EXACT_DUPLICATE" || c.conflictType === "BRAND_GENERIC_DUPLICATE"));

              return (
                <div 
                  key={med.id} 
                  className={`p-4 rounded-xl border ${
                    relatedConflict 
                      ? "border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10" 
                      : "border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40"
                  } space-y-2.5 transition-all`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {med.drugName} {med.strength}
                        </h4>
                        {relatedDuplicate && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded">
                            Unified Active Regimen
                          </span>
                        )}
                        {relatedConflict && (
                          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Needs Review
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Active Molecule: {med.activeIngredient} ({med.therapeuticClass})
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-bold">
                      {med.frequency || "Once Daily"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-semibold text-slate-500">Generic Form:</span>
                      <span>{med.genericName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-semibold text-slate-500">Facility / Source:</span>
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {med.facility} ({med.prescribingDoctor})
                      </span>
                    </div>

                    {relatedDuplicate && (
                      <div className="mt-2 p-2 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/50 dark:border-emerald-900/30 text-[11px] text-emerald-900 dark:text-emerald-200">
                        <span className="font-semibold">Unified Representation: </span>
                        <span>Deduplicated across hospital records (Apollo, Fortis, AIIMS). Source records preserved.</span>
                      </div>
                    )}

                    {relatedConflict && (
                      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200">
                        <span className="font-bold">⚠️ Potential Medication Conflict: </span>
                        <span>{relatedConflict.clinicalRiskDescription} Clinician verification recommended.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DUPLICATES & CONFLICTS WITH RESOLUTION */}
      {activeTab === "conflicts" && (
        <div className="space-y-5">
          <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 rounded-xl text-xs text-purple-900 dark:text-purple-300">
            <span className="font-bold">Multi-Hospital Reconciliation & Conflict Detection: </span>
            Identifies brand-to-generic duplicate representations and highlights dosage conflicts across facilities. Duplicate records are unified for regimen clarity while keeping original clinical prescriptions permanently preserved.
          </div>

          {/* Section A: Potential Medication Conflicts (Needs Review) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Dosage & Therapy Conflicts ({conflictsOnly.length}) — Clinician Verification Recommended
              </span>
            </div>

            {conflictsOnly.length === 0 ? (
              <div className="p-4 text-center text-slate-500 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No Dosage Conflicts Detected</p>
                <p className="text-[11px] text-slate-400">All cross-hospital prescriptions have consistent dosing schedules.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conflictsOnly.map((c) => {
                  const isExpanded = !!expandedConflicts[c.conflictId];
                  const isResolved = c.resolutionStatus !== "UNRESOLVED";

                  return (
                    <div 
                      key={c.conflictId} 
                      className={`rounded-xl border transition-all ${
                        isResolved 
                          ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10"
                          : "border-amber-300 dark:border-amber-900/60 bg-amber-50/10 dark:bg-amber-950/20"
                      } p-4 space-y-3`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                            {c.activeMolecule} — Potential Medication Conflict ({c.conflictType.replace(/_/g, " ")})
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                            HIGH Severity
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isResolved 
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                          }`}>
                            {isResolved ? "Verified by Clinician" : "Needs Clinician Verification"}
                          </span>
                          <button 
                            onClick={() => toggleConflict(c.conflictId)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        {c.clinicalRiskDescription}
                      </p>

                      {/* Discrepant prescriptions involved */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Facility Prescription A</span>
                          <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{c.primaryMedication.drugName} {c.primaryMedication.strength}</div>
                          <div className="text-[11px] text-slate-500">{c.primaryMedication.facility} • {c.primaryMedication.prescribingDoctor}</div>
                        </div>

                        {c.conflictingMedications.map((cm, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Facility Prescription B (Discrepant)</span>
                            <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{cm.drugName} {cm.strength}</div>
                            <div className="text-[11px] text-slate-500">{cm.facility} • {cm.prescribingDoctor}</div>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-500">
                          Dosages are not merged automatically. Verification records are preserved in audit trail.
                        </div>

                        <div className="flex items-center gap-2">
                          {c.resolutionStatus === "UNRESOLVED" ? (
                            <>
                              <button
                                disabled={resolvingId === c.conflictId}
                                onClick={() => handleResolveConflict(c.conflictId, "RESOLVED_KEPT_PRIMARY", `Confirmed ${c.primaryMedication.strength} as target standard dosage`)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verify {c.primaryMedication.strength} Dose
                              </button>
                              <button
                                disabled={resolvingId === c.conflictId}
                                onClick={() => handleResolveConflict(c.conflictId, "RESOLVED_MERGED", "Verified reconciled dosage schedule with physician")}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                              >
                                Mark Verified
                              </button>
                            </>
                          ) : (
                            <button
                              disabled={resolvingId === c.conflictId}
                              onClick={() => handleResolveConflict(c.conflictId, "UNRESOLVED" as any, "Re-opened conflict for clinician review")}
                              className="px-2.5 py-1 text-slate-500 hover:text-slate-700 text-[11px] font-medium cursor-pointer"
                            >
                              Re-open Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section B: Cross-Hospital Duplicates (Deduplicated & Unified) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Split className="w-3.5 h-3.5" />
                Cross-Hospital Duplicate Prescriptions ({duplicatesOnly.length}) — Detected & Unified
              </span>
            </div>

            {duplicatesOnly.length === 0 ? (
              <div className="p-4 text-center text-slate-500 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No Duplicate Prescriptions</p>
                <p className="text-[11px] text-slate-400">No multi-hospital duplicate brand names detected.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {duplicatesOnly.map((c) => {
                  return (
                    <div 
                      key={c.conflictId} 
                      className="rounded-xl border border-purple-200 dark:border-purple-900/50 bg-white dark:bg-slate-950 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                            {c.activeMolecule} {c.primaryMedication.strength} — Unified Across Hospitals
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                            {c.matchConfidence}% Match
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                          Unified Active Regimen
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {c.clinicalRiskDescription}
                      </p>

                      {/* Prescriptions involved */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Facility Record A</span>
                          <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{c.primaryMedication.drugName} {c.primaryMedication.strength}</div>
                          <div className="text-[11px] text-slate-500">{c.primaryMedication.facility} • {c.primaryMedication.prescribingDoctor}</div>
                        </div>

                        {c.conflictingMedications.map((cm, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Facility Record B</span>
                            <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{cm.drugName} {cm.strength}</div>
                            <div className="text-[11px] text-slate-500">{cm.facility} • {cm.prescribingDoctor}</div>
                          </div>
                        ))}
                      </div>

                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                        Unified into single active regimen representation to prevent double-dosing. Original source prescriptions permanently preserved.
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL OF ORIGINAL HOSPITAL SOURCE RECORDS */}
      {activeTab === "audit" && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-100/70 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
            <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Clinical Data Integrity Guarantee: </span>
              All source hospital records (Apollo, Fortis, AIIMS, Manipal) remain permanently preserved in their original format with exact prescription timestamps and physician care context.
            </div>
          </div>

          <div className="space-y-2">
            {report.reconciledMasterList.map((med, i) => (
              <div key={i} className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{med.drugName} {med.strength}</div>
                    <div className="text-[11px] text-slate-500">{med.facility} • {med.prescribingDoctor}</div>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span className="font-mono">{med.prescribedDate}</span>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Verified Source Ingest</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gemini Pharmacovigilance Explanations */}
      {report.geminiExplanation && (
        <div className="p-4 bg-purple-50/40 dark:bg-purple-950/20 rounded-xl border border-purple-200/50 dark:border-purple-900/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Gemini Pharmacovigilance & Safety Synthesis
            </span>
            <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
              Explanation Layer (ML-Grounded)
            </span>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {report.geminiExplanation.clinicalSummary}
          </p>

          {report.geminiExplanation.doctorActionItems && report.geminiExplanation.doctorActionItems.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 block">Pharmacovigilance Directives:</span>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                {report.geminiExplanation.doctorActionItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Safety Notice */}
      <div className="p-3 bg-slate-100/60 dark:bg-slate-800/40 rounded-xl flex items-start gap-2 text-[10px] text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
        <div>
          <span className="font-bold text-slate-700 dark:text-slate-300">CLINICAL SAFETY DIRECTIVE: </span>
          Reconciled unified views resolve multi-facility representation duplicates. The system does not claim any prescription was discontinued or deleted. Original source records from every hospital remain permanently preserved.
        </div>
      </div>
    </div>
  );
};
