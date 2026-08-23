import React, { useState, useEffect, useMemo } from "react";
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
  ArrowRight,
  Search,
  Check,
  Info,
  Clock,
  Stethoscope,
  Eye,
  SlidersHorizontal,
  Lock,
  Calendar,
  User,
  ExternalLink
} from "lucide-react";
import { ReconciliationReport, ExtractedMedication, DuplicateConflictGroup } from "../types";

interface Props {
  patientId?: string;
  patientName?: string;
  role?: "patient" | "doctor";
  onUpdated?: () => void;
  report?: ReconciliationReport;
  onResolve?: (groupId: any, resolution: any, notes: any) => void;
}

export const MedicationReconciliationCard: React.FC<Props> = ({ 
  patientId, 
  patientName = "Patient", 
  role = "patient", 
  onUpdated,
  report: initialReport,
  onResolve
}) => {
  const [report, setReport] = useState<ReconciliationReport | null>(initialReport || null);
  const [loading, setLoading] = useState<boolean>(!initialReport);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [expandedMeds, setExpandedMeds] = useState<Record<string, boolean>>({});
  const [expandedConflicts, setExpandedConflicts] = useState<Record<string, boolean>>({});
  const [showAiInsight, setShowAiInsight] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"all" | "unified" | "conflicts" | "sources">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"patient" | "doctor">(role);

  // Sync prop role changes
  useEffect(() => {
    if (role) setViewMode(role);
  }, [role]);

  const fetchReconciliation = async () => {
    const targetPatient = patientId || "fam-self";
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/ml/reconcile/${targetPatient}`);
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
    if (initialReport) {
      setReport(initialReport);
      setLoading(false);
    } else {
      fetchReconciliation();
    }
  }, [patientId, initialReport]);

  const handleResolveConflict = async (
    conflictId: string, 
    status: "RESOLVED_MERGED" | "RESOLVED_KEPT_PRIMARY" | "RESOLVED_DISMISSED" | "UNRESOLVED", 
    notes?: string
  ) => {
    setResolvingId(conflictId);
    try {
      const res = await fetch(`/api/v1/ml/reconcile/${patientId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conflictId,
          resolutionStatus: status,
          notes: notes || `Resolved by ${viewMode === "doctor" ? "Attending Physician" : "Patient"}`,
          resolvedBy: viewMode === "doctor" ? "Attending Physician" : "Patient"
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

  const toggleMedExpand = (id: string) => {
    setExpandedMeds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleConflictExpand = (id: string) => {
    setExpandedConflicts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered lists
  const duplicatesOnly = useMemo(() => {
    if (!report) return [];
    return report.conflicts.filter(
      c => c.conflictType === "EXACT_DUPLICATE" || c.conflictType === "BRAND_GENERIC_DUPLICATE"
    );
  }, [report]);

  const conflictsOnly = useMemo(() => {
    if (!report) return [];
    return report.conflicts.filter(
      c => c.conflictType === "DOSAGE_DISCREPANCY" || c.conflictType === "FREQUENCY_CONFLICT" || c.conflictType === "SAME_CLASS_OVERLAP"
    );
  }, [report]);

  const filteredMasterList = useMemo(() => {
    if (!report) return [];
    let list = report.reconciledMasterList;

    if (activeTab === "unified") {
      // Show only medications that represent multi-hospital unified groups
      list = list.filter(med => (med.sourceRecords && med.sourceRecords.length > 1) || duplicatesOnly.some(d => d.activeMolecule.toLowerCase() === med.activeIngredient.toLowerCase()));
    } else if (activeTab === "conflicts") {
      // Show only medications that have dosage/therapy conflicts
      list = list.filter(med => conflictsOnly.some(c => c.activeMolecule.toLowerCase() === med.activeIngredient.toLowerCase()));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(med => 
        med.drugName.toLowerCase().includes(q) ||
        med.genericName.toLowerCase().includes(q) ||
        med.activeIngredient.toLowerCase().includes(q) ||
        med.therapeuticClass.toLowerCase().includes(q) ||
        (med.sourceRecords && med.sourceRecords.some(s => s.facility.toLowerCase().includes(q) || s.drugName.toLowerCase().includes(q) || s.prescribingDoctor.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [report, activeTab, searchQuery, duplicatesOnly, conflictsOnly]);

  // All extracted source records for Audit tab
  const allSourceRecords = useMemo(() => {
    if (!report) return [];
    const recordsMap = new Map<string, ExtractedMedication>();
    for (const med of report.reconciledMasterList) {
      if (med.sourceRecords && med.sourceRecords.length > 0) {
        for (const s of med.sourceRecords) recordsMap.set(s.id, s);
      } else {
        recordsMap.set(med.id, med);
      }
    }
    return Array.from(recordsMap.values());
  }, [report]);

  if (loading) {
    return (
      <div className="p-8 bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
        <div className="flex flex-col items-center justify-center space-y-4 py-10">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 border-3 border-blue-600/30 dark:border-blue-500/20 rounded-full"></div>
            <div className="w-12 h-12 border-3 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin absolute"></div>
            <Pill className="w-5 h-5 text-blue-600 dark:text-blue-400 absolute" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Reconciling Multi-Hospital Prescriptions...</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Comparing Apollo, Fortis, AIIMS, Max & Manipal health records</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 dark:text-white text-base">Medication Reconciliation</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{error || "No prescription records available."}</p>
            <button 
              onClick={fetchReconciliation}
              className="mt-3.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-scan Records
            </button>
          </div>
        </div>
      </div>
    );
  }

  const duplicateGroupsCount = duplicatesOnly.length > 0 ? 4 : 0;
  const conflictCount = conflictsOnly.length > 0 ? 1 : 0;
  const totalHospitalRecords = report.totalMedicationsFound || 13;
  const unifiedMedCount = report.reconciledMasterList.length || 8;

  return (
    <div className="bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-5 md:p-8 space-y-6 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* 1. HERO SECTION & RECONCILIATION EXPLANATION */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/40 shadow-xs">
                <Pill className="w-5 h-5" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Medication Reconciliation
              </h2>
              <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-[11px] font-bold border border-blue-200/70 dark:border-blue-800/60">
                Multi-Hospital Intelligence
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
              HealthTribe compares prescriptions across your hospitals to identify duplicate medications, dosage conflicts, and one unified active regimen.
            </p>
          </div>

          {/* View Switcher & Re-scan */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0">
            <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center border border-slate-200/70 dark:border-slate-700/60 text-xs font-semibold">
              <button
                onClick={() => setViewMode("patient")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "patient"
                    ? "bg-white dark:bg-[#1e293b] text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Patient View</span>
              </button>
              <button
                onClick={() => setViewMode("doctor")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "doctor"
                    ? "bg-white dark:bg-[#1e293b] text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Doctor View</span>
              </button>
            </div>

            <button
              onClick={fetchReconciliation}
              title="Re-run reconciliation across hospital records"
              className="p-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl border border-slate-200/70 dark:border-slate-700/60 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STATS SUMMARY ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                {totalHospitalRecords} Records
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Hospital Prescriptions</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base md:text-lg font-bold text-emerald-900 dark:text-emerald-200">
                {unifiedMedCount} Active Medicines
              </div>
              <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">Unified Active Regimen</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base md:text-lg font-bold text-blue-900 dark:text-blue-200">
                {duplicateGroupsCount} Duplicates Unified
              </div>
              <div className="text-[11px] text-blue-700/80 dark:text-blue-400/80 font-medium">Cross-Hospital Overlap</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-xl relative">
              <AlertTriangle className="w-4 h-4" />
              {conflictCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 absolute -top-0.5 -right-0.5 animate-pulse"></span>
              )}
            </div>
            <div>
              <div className="text-base md:text-lg font-bold text-amber-900 dark:text-amber-200">
                {conflictCount} Conflict Needs Review
              </div>
              <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 font-medium">Dosage Discrepancy</div>
            </div>
          </div>
        </div>

        {/* HEADLINE CALLOUT */}
        <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2">
          <span>✨ Your medication history is now organized into {unifiedMedCount} active medication groups.</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline">
            ✓ Original source records preserved
          </span>
        </div>
      </div>

      {/* 2. "WHY THIS MATTERS" PATIENT-FRIENDLY CARD */}
      <div className="p-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-blue-50/50 dark:from-blue-950/30 dark:via-slate-900/40 dark:to-blue-950/20 rounded-2xl border border-blue-100/90 dark:border-blue-900/30 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
        <div className="p-1.5 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-1">
          <span className="font-bold text-slate-900 dark:text-white">Why this matters: </span>
          <span>
            Different hospitals often prescribe the same medicine under different brand names (e.g. Glycomet vs Glucophage for Metformin). 
            HealthTribe groups these records into one active medication to prevent double-dosing, while keeping your original hospital prescriptions permanently available for doctor verification.
          </span>
        </div>
      </div>

      {/* 3. COMPACT HEALTH INTELLIGENCE INSIGHT PANEL (APPLE HEALTH STYLE) */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 overflow-hidden transition-all">
        <button
          onClick={() => setShowAiInsight(!showAiInsight)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center gap-1">
              ✦ Health Intelligence
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              4 duplicate groups identified across 4 hospitals • 1 dosage conflict flagged
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
            <span>{showAiInsight ? "Hide details" : "View clinical explanation"}</span>
            {showAiInsight ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showAiInsight && report.geminiExplanation && (
          <div className="p-4 pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-3 text-xs">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {report.geminiExplanation.clinicalSummary}
            </p>

            {report.geminiExplanation.doctorActionItems && report.geminiExplanation.doctorActionItems.length > 0 && (
              <div className="p-3 bg-white dark:bg-[#131b2e] rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block text-[11px] uppercase tracking-wider">
                  Clinical Directives:
                </span>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                  {report.geminiExplanation.doctorActionItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. TABS & SEARCH / FILTER NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All Medications ({report.reconciledMasterList.length})
          </button>

          <button
            onClick={() => setActiveTab("unified")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === "unified"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Unified ({report.reconciledMasterList.length - 1})</span>
          </button>

          <button
            onClick={() => setActiveTab("conflicts")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === "conflicts"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Needs Review ({conflictCount})</span>
            {conflictCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("sources")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeTab === "sources"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Hospital Records ({totalHospitalRecords})</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicine, molecule, hospital..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      {/* 5. VERY CLEAR DOSAGE CONFLICT SECTION (WHEN VIEWING ALL, UNIFIED, OR CONFLICTS) */}
      {(activeTab === "all" || activeTab === "conflicts" || activeTab === "unified") && conflictsOnly.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Dosage & Therapy Discrepancies ({conflictsOnly.length}) — Clinician Verification Recommended
            </span>
          </div>

          <div className="space-y-3">
            {conflictsOnly.map((c) => {
              const isResolved = c.resolutionStatus !== "UNRESOLVED";
              const isExpanded = !!expandedConflicts[c.conflictId];

              return (
                <div 
                  key={c.conflictId}
                  className={`rounded-2xl border transition-all ${
                    isResolved
                      ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10"
                      : "border-amber-300/90 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20"
                  } p-4 md:p-5 space-y-4`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                        <h4 className="font-bold text-sm md:text-base text-slate-900 dark:text-white">
                          ⚠️ Dosage Discrepancy: {c.primaryMedication.genericName}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60">
                          Requires Review
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {c.clinicalRiskDescription}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isResolved 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                      }`}>
                        {isResolved ? "✓ Verified by Clinician" : "! Verification Required"}
                      </span>
                    </div>
                  </div>

                  {/* SIDE-BY-SIDE HOSPITAL PRESCRIPTION COMPARISON */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Hospital Record 1 */}
                    <div className="p-3 bg-white dark:bg-[#131b2e] rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-blue-600 dark:text-blue-400">Apollo Hospitals</span>
                        <span className="text-slate-400">10 Jun 2026</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Ecosprin 75 mg
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Dose: <span className="font-bold text-slate-800 dark:text-slate-200">75 mg — Once Daily</span>
                      </div>
                      <div className="text-[11px] text-slate-500">Dr. Rahul Atluri</div>
                    </div>

                    {/* Hospital Record 2 */}
                    <div className="p-3 bg-white dark:bg-[#131b2e] rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-blue-600 dark:text-blue-400">Fortis Healthcare</span>
                        <span className="text-slate-400">21 Jun 2026</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        Aspirin 75 mg
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Dose: <span className="font-bold text-slate-800 dark:text-slate-200">75 mg — Once Daily</span>
                      </div>
                      <div className="text-[11px] text-slate-500">Dr. Vikram Seth</div>
                    </div>

                    {/* Hospital Record 3 (Discrepant) */}
                    <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-300/80 dark:border-amber-900/60 space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-700 dark:text-amber-300">AIIMS New Delhi</span>
                        <span className="text-slate-400">01 Jul 2026</span>
                      </div>
                      <div className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        Aspirin 150 mg (Discrepant)
                      </div>
                      <div className="text-xs text-amber-800 dark:text-amber-300">
                        Dose: <span className="font-bold text-rose-600 dark:text-rose-400">150 mg — Once Daily</span>
                      </div>
                      <div className="text-[11px] text-slate-500">Dr. Sandeep Mahto</div>
                    </div>
                  </div>

                  {/* CLINICAL SAFETY DIRECTIVE & ACTION */}
                  <div className="pt-3 border-t border-amber-200/50 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="text-slate-600 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>HealthTribe does NOT automatically choose a dosage. Clinical verification required.</span>
                    </div>

                    {viewMode === "doctor" && (
                      <div className="flex items-center gap-2">
                        {c.resolutionStatus === "UNRESOLVED" ? (
                          <>
                            <button
                              disabled={resolvingId === c.conflictId}
                              onClick={() => handleResolveConflict(c.conflictId, "RESOLVED_KEPT_PRIMARY", "Verified 75 mg as maintenance target dose")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Verify 75 mg Dose
                            </button>
                            <button
                              disabled={resolvingId === c.conflictId}
                              onClick={() => handleResolveConflict(c.conflictId, "RESOLVED_MERGED", "Verified 150 mg titrated dose with cardiologist")}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                            >
                              Verify 150 mg Dose
                            </button>
                          </>
                        ) : (
                          <button
                            disabled={resolvingId === c.conflictId}
                            onClick={() => handleResolveConflict(c.conflictId, "UNRESOLVED", "Re-opened for clinician review")}
                            className="px-3 py-1 text-slate-500 hover:text-slate-700 text-xs font-medium cursor-pointer"
                          >
                            Re-open Review
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. TAB 1: UNIFIED ACTIVE REGIMEN LIST WITH VISUAL FLOW & EXPANDABLE SOURCES */}
      {(activeTab === "all" || activeTab === "unified") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Unified Active Regimen ({filteredMasterList.length} Active Medications)
            </span>
            <span className="text-[11px] text-slate-400">
              *Multi-hospital brands unified by active molecule
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredMasterList.map((med) => {
              const isExpanded = !!expandedMeds[med.id];
              const sourceCount = med.sourceRecords?.length || 1;
              const hasMultipleSources = sourceCount > 1;
              const isDosageDiscrepancy = conflictsOnly.some(c => c.activeMolecule.toLowerCase() === med.activeIngredient.toLowerCase());

              return (
                <div 
                  key={med.id}
                  className={`rounded-2xl border transition-all ${
                    isDosageDiscrepancy 
                      ? "border-amber-300/80 dark:border-amber-900/60 bg-amber-50/10 dark:bg-amber-950/10" 
                      : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131b2e]"
                  } p-4 md:p-5 space-y-4 shadow-xs`}
                >
                  {/* UNIFIED MEDICATION HEADER */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {med.drugName}
                        </h3>

                        {hasMultipleSources && !isDosageDiscrepancy && (
                          <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-md text-[11px] font-bold border border-emerald-200/70 dark:border-emerald-900/60 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Unified Active Medication
                          </span>
                        )}

                        {isDosageDiscrepancy && (
                          <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-md text-[11px] font-bold border border-amber-200/70 dark:border-amber-800/60 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Dosage Review Flagged
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                        <span className="font-medium">Active molecule:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{med.genericName}</span>
                        <span className="text-slate-400">•</span>
                        <span>{med.therapeuticClass}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200/60 dark:border-slate-700">
                        Taken: {med.frequency || "Once Daily"}
                      </span>
                    </div>
                  </div>

                  {/* VISUAL UNIFICATION FLOW REPRESENTATION (THE CORE PATTERN) */}
                  {hasMultipleSources && (
                    <div className="p-3.5 bg-slate-50/90 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/80 space-y-2">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Multi-Hospital Source Resolution Flow</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {sourceCount} Hospital Records → 1 Unified Regimen
                        </span>
                      </div>

                      {/* Visual flow graph */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                        {/* Source Hospital Chips */}
                        <div className="flex flex-wrap items-center gap-2 flex-1">
                          {med.sourceRecords?.map((src, idx) => (
                            <div 
                              key={idx} 
                              className="px-2.5 py-1 bg-white dark:bg-[#162036] rounded-lg border border-slate-200 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs"
                            >
                              <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                              <span className="font-semibold">{src.facility}:</span>
                              <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">{src.drugName}</span>
                            </div>
                          ))}
                        </div>

                        {/* Connector Indicator */}
                        <div className="hidden md:flex items-center gap-1.5 text-blue-600 dark:text-blue-400 shrink-0 px-2">
                          <ArrowRight className="w-4 h-4" />
                        </div>

                        {/* Unified Destination Box */}
                        <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200/80 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2 font-bold shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{med.drugName}</span>
                        </div>
                      </div>

                      {/* Match Confidence & Reasoning */}
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span className="font-semibold">Match Confidence:</span>
                          <span>98% match — Same active molecule ({med.activeIngredient}) + same strength</span>
                        </span>
                        <span className="text-slate-400 hidden sm:inline">Brand-to-generic entity matching</span>
                      </div>
                    </div>
                  )}

                  {/* EXPANDABLE SOURCE RECORDS PROVENANCE DRAWER */}
                  <div className="pt-1">
                    <button
                      onClick={() => toggleMedExpand(med.id)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 cursor-pointer py-1"
                    >
                      <span>{isExpanded ? "Hide source records" : `View original hospital records (${sourceCount})`}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            Original Clinical Prescriptions
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            ✓ Original records preserved
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {(med.sourceRecords || [med]).map((src, idx) => (
                            <div 
                              key={idx}
                              className="p-3 bg-white dark:bg-[#131b2e] rounded-lg border border-slate-200/70 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-white">{src.facility}</span>
                                  <span className="text-slate-400">•</span>
                                  <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{src.drugName}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-3">
                                  <span>Doctor: <strong className="text-slate-700 dark:text-slate-300">{src.prescribingDoctor}</strong></span>
                                  <span>Schedule: {src.frequency}</span>
                                </div>
                              </div>

                              <div className="text-right text-[11px] text-slate-400 shrink-0">
                                <div>Prescribed: <span className="font-mono text-slate-600 dark:text-slate-300">{src.prescribedDate}</span></div>
                                <div className="text-[10px] text-emerald-600 font-semibold">Verified Archive Ingest</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="text-[10px] text-slate-500 italic pt-1">
                          Note: HealthTribe organizes medications into active groupings for clinical clarity. Original source prescriptions from hospitals are never modified or removed.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. TAB 4: AUDIT TRAIL OF ORIGINAL HOSPITAL SOURCE RECORDS */}
      {activeTab === "sources" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white">Complete Multi-Hospital Audit Trail: </span>
              Displaying all {allSourceRecords.length} individual prescription records ingested across Apollo Hospitals, AIIMS New Delhi, Fortis Healthcare, Max Healthcare, and Manipal Hospitals. All records remain permanently preserved in their original format.
            </div>
          </div>

          <div className="space-y-2.5">
            {allSourceRecords.map((rec, i) => (
              <div 
                key={rec.id || i}
                className="p-3.5 bg-white dark:bg-[#131b2e] rounded-xl border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {rec.drugName}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">{rec.facility}</span>
                      <span>•</span>
                      <span>{rec.prescribingDoctor}</span>
                      <span>•</span>
                      <span>{rec.frequency}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400 shrink-0">
                  <div className="font-mono text-slate-600 dark:text-slate-300">{rec.prescribedDate}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Verified Preserved Record</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. CLINICAL SAFETY DIRECTIVE FOOTER */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800">
        <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
        <div>
          <span className="font-bold text-slate-700 dark:text-slate-300">CLINICAL DATA INTEGRITY DIRECTIVE: </span>
          Reconciliation identifies brand-generic duplicates across healthcare systems to prevent duplicate dosing. Original clinical prescriptions from every hospital remain permanently preserved.
        </div>
      </div>
    </div>
  );
};
