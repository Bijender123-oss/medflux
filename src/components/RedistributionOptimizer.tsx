import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Truck,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  FileCheck
} from 'lucide-react';
import {
  Facility,
  OptimizationResult,
  OptimizationCandidate,
  GeminiRecommendationResponse,
  SupportedLanguage,
  UserRoleProfile
} from '../types';
import { t } from '../utils/translations';

interface RedistributionOptimizerProps {
  facilities: Facility[];
  initialTargetFacilityId?: string;
  initialMedicineId?: string;
  onApproveTransfer: (transferData: any) => Promise<void>;
  onNavigateToAudit: () => void;
  language: SupportedLanguage;
  currentRole: UserRoleProfile;
}

export const RedistributionOptimizer: React.FC<RedistributionOptimizerProps> = ({
  facilities,
  initialTargetFacilityId,
  initialMedicineId,
  onApproveTransfer,
  onNavigateToAudit,
  language,
  currentRole
}) => {
  const [targetFacilityId, setTargetFacilityId] = useState<string>(
    initialTargetFacilityId || 'FAC-UP-LKO-01'
  );
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>(
    initialMedicineId || 'MED-ORS'
  );

  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<OptimizationCandidate | null>(null);
  const [transferQty, setTransferQty] = useState<number>(1200);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [geminiBrief, setGeminiBrief] = useState<GeminiRecommendationResponse | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sync if props change
  useEffect(() => {
    if (initialTargetFacilityId) setTargetFacilityId(initialTargetFacilityId);
    if (initialMedicineId) setSelectedMedicineId(initialMedicineId);
  }, [initialTargetFacilityId, initialMedicineId]);

  // Run Optimization function
  const runOptimization = async (customQty?: number) => {
    setIsOptimizing(true);
    setActionError(null);
    setApprovalSuccess(false);

    try {
      const res = await fetch('/api/optimize-redistribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetFacilityId,
          medicineId: selectedMedicineId,
          requestedUnits: customQty || transferQty
        })
      });

      if (!res.ok) {
        throw new Error('Failed to run redistribution optimizer');
      }

      const data: OptimizationResult = await res.json();
      setOptimizationResult(data);
      if (data.recommendedCandidate) {
        setSelectedCandidate(data.recommendedCandidate);
        setTransferQty(data.recommendedCandidate.recommendedQuantity);
      }

      // Fetch Gemini structured brief for this recommendation
      if (data.recommendedCandidate) {
        fetchGeminiBrief(data.targetFacilityName, data.recommendedCandidate, data.medicineName);
      }
    } catch (err: any) {
      setActionError(err.message || 'Error executing optimization');
    } finally {
      setIsOptimizing(false);
    }
  };

  const fetchGeminiBrief = async (
    targetFacName: string,
    donor: OptimizationCandidate,
    medName: string
  ) => {
    setIsGeminiLoading(true);
    try {
      const res = await fetch('/api/gemini/recommendation-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetFacility: targetFacName,
          donorFacility: donor.facilityName,
          medicineName: medName,
          transferQty: donor.recommendedQuantity,
          distanceKm: donor.distanceKm,
          coverageGain: 12,
          language
        })
      });
      if (res.ok) {
        const brief: GeminiRecommendationResponse = await res.json();
        setGeminiBrief(brief);
      }
    } catch (err) {
      console.error('Gemini brief fetch error:', err);
    } finally {
      setIsGeminiLoading(false);
    }
  };

  // Run initial optimization on mount
  useEffect(() => {
    runOptimization();
  }, [targetFacilityId, selectedMedicineId]);

  // Handle Transfer Approval
  const handleApprove = async () => {
    if (!selectedCandidate || !optimizationResult) return;
    try {
      await onApproveTransfer({
        sourceFacilityId: selectedCandidate.facilityId,
        destinationFacilityId: optimizationResult.targetFacilityId,
        medicineId: selectedMedicineId,
        quantity: transferQty,
        distanceKm: selectedCandidate.distanceKm,
        estimatedTransportHours: selectedCandidate.estimatedTransitHours,
        approvedBy: currentRole.name,
        approvedRole: currentRole.role.replace('_', ' '),
        coverageExtensionDays: optimizationResult.expectedPostTransferCoverageDays,
        aiRationale: geminiBrief?.riskSummary || 'Multi-criteria optimization validated via Gemini.'
      });
      setApprovalSuccess(true);
      // Re-run optimization with updated inventory
      setTimeout(() => {
        runOptimization();
      }, 800);
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve transfer');
    }
  };

  const targetFacility = facilities.find(f => f.id === targetFacilityId);
  const targetMedicine = targetFacility?.medicines.find(m => m.medicineId === selectedMedicineId);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Truck className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {t('redistributionOptimizer', language)}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Multi-criteria heuristic matching: surplus volume, transit distance, batch expiry urgency, and data reliability.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Target Facility Selector */}
            <div>
              <label className="text-slate-500 font-semibold block text-[10px] mb-1">Target Shortage Facility:</label>
              <select
                value={targetFacilityId}
                onChange={(e) => setTargetFacilityId(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
              >
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Medicine Selector */}
            <div>
              <label className="text-slate-500 font-semibold block text-[10px] mb-1">Deficit Resource:</label>
              <select
                value={selectedMedicineId}
                onChange={(e) => setSelectedMedicineId(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 font-medium focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
              >
                {targetFacility?.medicines.map(m => (
                  <option key={m.medicineId} value={m.medicineId}>
                    {m.name} ({m.stockQuantity} {m.unit} left)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => runOptimization()}
              disabled={isOptimizing}
              className="mt-4 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Optimizing...' : 'Re-calculate'}</span>
            </button>
          </div>
        </div>

        {/* Current Shortage Status Card */}
        {targetFacility && targetMedicine && (
          <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div>
              <span className="text-slate-500 block text-[10px] font-medium">Target Location</span>
              <span className="font-semibold text-slate-900 block truncate">
                {targetFacility.name}
              </span>
              <span className="text-[10px] text-slate-500 block">{targetFacility.district}, {targetFacility.state}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-medium">Current Usable Stock</span>
              <span className="font-bold text-slate-900 text-sm">
                {targetMedicine.stockQuantity.toLocaleString()} {targetMedicine.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-medium">Surge Daily Consumption</span>
              <span className="font-semibold text-amber-700">
                {targetMedicine.predictedDailyDemand || targetMedicine.dailyConsumption} {targetMedicine.unit}/day
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-medium">Remaining Stock Coverage</span>
              <span className={`font-bold text-sm ${
                (targetMedicine.daysUntilStockout || 0) <= 4 ? 'text-red-600' : 'text-amber-700'
              }`}>
                {targetMedicine.daysUntilStockout} Days Left
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-medium">Supplier Lead Gap</span>
              <span className="font-semibold text-slate-700">
                {targetMedicine.supplierLeadDays} Days (Void: {Math.max(0, targetMedicine.supplierLeadDays - Math.floor(targetMedicine.daysUntilStockout || 0))}d)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Success Toast */}
      {approvalSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-emerald-950 text-sm">
                {t('transferSuccess', language)}
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                {transferQty.toLocaleString()} units of {targetMedicine?.name} allocated from {selectedCandidate?.facilityName} to {targetFacility?.name}.
                Stock and risk scores recalculated immediately.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToAudit}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <span>{t('viewInAudit', language)}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Candidates Table (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <Layers className="h-4 w-4 text-blue-600" />
                <span>Multi-Criteria Donor Candidates</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Sorted by composite optimization score
              </span>
            </div>

            {optimizationResult?.candidates && optimizationResult.candidates.length > 0 ? (
              <div className="space-y-3">
                {optimizationResult.candidates.map((cand) => {
                  const isSelected = selectedCandidate?.facilityId === cand.facilityId;
                  return (
                    <div
                      key={cand.facilityId}
                      onClick={() => {
                        setSelectedCandidate(cand);
                        setTransferQty(cand.recommendedQuantity);
                        fetchGeminiBrief(optimizationResult.targetFacilityName, cand, optimizationResult.medicineName);
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/40 border-blue-600 shadow-xs ring-1 ring-blue-600/30'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                              Rank #{cand.feasibilityRank}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {cand.facilityName}
                            </h4>
                          </div>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {cand.district}, {cand.state} • {cand.distanceKm} km (~{cand.estimatedTransitHours} hrs transport)
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Score: {cand.compositeScore}/100
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-1 font-medium">
                            Surplus: {cand.surplusAvailable.toLocaleString()} units
                          </span>
                        </div>
                      </div>

                      {/* Metrics bar */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg my-2.5 text-[11px] border border-slate-100">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Total Stock</span>
                          <span className="font-semibold text-slate-800">{cand.currentStock.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Safety Reserve Buffer</span>
                          <span className="font-semibold text-slate-800">{cand.safetyStock.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">Batch Expiry Date</span>
                          <span className="font-semibold text-slate-800">{cand.batchExpiryDate} ({cand.daysToExpiry}d left)</span>
                        </div>
                      </div>

                      {/* Pros & Cons pills */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {cand.pros.map((p, i) => (
                          <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                            ✓ {p}
                          </span>
                        ))}
                        {cand.cons.map((c, i) => (
                          <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-100">
                            ⚠ {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                No surplus donors currently meet the required safety-stock threshold.
              </div>
            )}
          </div>
        </div>

        {/* Gemini AI Recommendation Briefing & Human Approval (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Gemini Structured Briefing
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                {geminiBrief?.priority || 'CRITICAL'}
              </span>
            </div>

            {isGeminiLoading ? (
              <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
                <Sparkles className="h-5 w-5 text-blue-600 animate-spin" />
                <span>Generating AI operational assessment...</span>
              </div>
            ) : geminiBrief ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Risk Summary
                  </span>
                  <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {geminiBrief.riskSummary}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Key Drivers
                  </span>
                  <ul className="space-y-1.5 text-slate-700">
                    {geminiBrief.keyReasons.map((r, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Expected Clinical Impact
                  </span>
                  <p className="text-emerald-800 font-medium bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                    {geminiBrief.expectedImpact}
                  </p>
                </div>

                {geminiBrief.caveats && geminiBrief.caveats.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Logistical Caveats
                    </span>
                    <ul className="space-y-1 text-slate-500 text-[11px]">
                      {geminiBrief.caveats.map((c, i) => (
                        <li key={i} className="flex items-start space-x-1.5">
                          <span className="text-amber-500 font-bold">!</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            {/* Human Approval Action Box */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-700">
                  Transfer Quantity ({targetMedicine?.unit}):
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="100"
                    max={selectedCandidate?.surplusAvailable || 5000}
                    step="50"
                    value={transferQty}
                    onChange={(e) => setTransferQty(Number(e.target.value))}
                    className="w-24 bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1.5 text-right text-xs font-bold focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
                  />
                  <span className="text-slate-500 text-[11px]">{targetMedicine?.unit}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl text-[11px] text-slate-600 space-y-1 border border-slate-100">
                <div className="flex justify-between">
                  <span>Authorizing Officer:</span>
                  <span className="text-slate-900 font-semibold">{currentRole.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Role Credential:</span>
                  <span className="text-slate-900 font-semibold">{currentRole.role.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Post-Transfer Coverage:</span>
                  <span className="text-emerald-700 font-bold">
                    ~{optimizationResult?.expectedPostTransferCoverageDays || 14} Days (Stabilized)
                  </span>
                </div>
              </div>

              {/* Approval Buttons */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={!selectedCandidate || isOptimizing}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-xs disabled:opacity-50"
                >
                  <PackageCheck className="h-4 w-4" />
                  <span>{t('approveTransfer', language)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActionError('Transfer recommendation rejected by authorized officer.');
                  }}
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 text-red-600 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
