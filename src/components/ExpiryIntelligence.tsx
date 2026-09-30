import React, { useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  Package,
  ArrowRight,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { Facility, MedicineInventory, SupportedLanguage } from '../types';
import { t } from '../utils/translations';

interface ExpiryIntelligenceProps {
  facilities: Facility[];
  language: SupportedLanguage;
  onNavigateToOptimizer: (targetFacId: string, medId: string) => void;
}

export const ExpiryIntelligence: React.FC<ExpiryIntelligenceProps> = ({
  facilities,
  language,
  onNavigateToOptimizer
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Flatten all medicines across facilities
  const allBatches: { facility: Facility; medicine: MedicineInventory }[] = [];
  facilities.forEach(fac => {
    fac.medicines.forEach(med => {
      allBatches.push({ facility: fac, medicine: med });
    });
  });

  const filteredBatches = allBatches.filter(({ medicine }) => {
    if (statusFilter === 'ALL') return true;
    return medicine.expiryRisk === statusFilter;
  });

  // Sort: URGENT first, then AT_RISK, WATCH, SAFE
  const riskWeights: Record<string, number> = {
    URGENT: 4,
    AT_RISK: 3,
    WATCH: 2,
    SAFE: 1
  };
  filteredBatches.sort((a, b) => {
    const wa = riskWeights[a.medicine.expiryRisk || 'SAFE'] || 0;
    const wb = riskWeights[b.medicine.expiryRisk || 'SAFE'] || 0;
    if (wa !== wb) return wb - wa;
    return (a.medicine.daysUntilExpiry || 999) - (b.medicine.daysUntilExpiry || 999);
  });

  const urgentCount = allBatches.filter(b => b.medicine.expiryRisk === 'URGENT').length;
  const atRiskCount = allBatches.filter(b => b.medicine.expiryRisk === 'AT_RISK').length;
  const watchCount = allBatches.filter(b => b.medicine.expiryRisk === 'WATCH').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {t('expiryIntelligence', language)}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Detects medicine batches that will expire before expected local patient consumption.
          Enables proactive inter-facility transfer to high-throughput hospitals before expiry occurs.
        </p>

        {/* Counter cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
          <div className="bg-red-50/60 border border-red-200 p-3.5 rounded-xl">
            <span className="text-red-700 block text-[10px] font-bold uppercase tracking-wider">URGENT EXPIRY (&lt;60d)</span>
            <span className="font-bold text-red-600 text-xl">{urgentCount} Batches</span>
            <span className="text-[10px] text-red-700 block mt-0.5">Immediate Transfer Recommended</span>
          </div>

          <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-xl">
            <span className="text-amber-800 block text-[10px] font-bold uppercase tracking-wider">AT RISK (&lt;150d)</span>
            <span className="font-bold text-amber-700 text-xl">{atRiskCount} Batches</span>
            <span className="text-[10px] text-amber-800 block mt-0.5">Surplus Exceeds Local Demand</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-slate-600 block text-[10px] font-bold uppercase tracking-wider">WATCH (&lt;365d)</span>
            <span className="font-bold text-slate-800 text-xl">{watchCount} Batches</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Monitored Velocity</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-emerald-700 block text-[10px] font-bold uppercase tracking-wider">TOTAL INVENTORIED</span>
            <span className="font-bold text-slate-900 text-xl">{allBatches.length} Batches</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Across 30 Facilities</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-slate-500 font-semibold">Filter Expiry Status:</span>
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['ALL', 'URGENT', 'AT_RISK', 'WATCH', 'SAFE'] as const).map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Medicine &amp; Batch</th>
                <th className="py-3.5 px-4">Facility &amp; District</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4">Daily Velocity</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Days to Expiry</th>
                <th className="py-3.5 px-4">Expiry Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.slice(0, 15).map(({ facility, medicine }) => {
                const isUrgent = medicine.expiryRisk === 'URGENT';
                const isAtRisk = medicine.expiryRisk === 'AT_RISK';
                const isWatch = medicine.expiryRisk === 'WATCH';

                const badgeClass = isUrgent
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : isAtRisk
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : isWatch
                  ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                return (
                  <tr key={`${facility.id}-${medicine.batchNumber}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{medicine.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Batch: {medicine.batchNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{facility.name}</div>
                      <span className="text-[10px] text-slate-400">
                        {facility.district}, {facility.state}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {medicine.stockQuantity.toLocaleString()} {medicine.unit}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {medicine.predictedDailyDemand || medicine.dailyConsumption} {medicine.unit}/day
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {medicine.expiryDate}
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      <span className={isUrgent ? 'text-red-600' : isAtRisk ? 'text-amber-700' : 'text-slate-600'}>
                        {medicine.daysUntilExpiry} days
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                        {medicine.expiryRisk}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {(isUrgent || isAtRisk) ? (
                        <button
                          type="button"
                          onClick={() => onNavigateToOptimizer(facility.id, medicine.medicineId)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px] transition-colors inline-flex items-center space-x-1 shadow-xs"
                        >
                          <span>Redistribute Before Expiry</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">Safe</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
