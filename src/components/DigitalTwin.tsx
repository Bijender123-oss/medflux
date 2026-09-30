import React, { useState } from 'react';
import {
  Network,
  Building2,
  Bed,
  Users,
  Package,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Facility, SupportedLanguage } from '../types';
import { t } from '../utils/translations';

interface DigitalTwinProps {
  facilities: Facility[];
  language: SupportedLanguage;
  onSelectFacility: (facId: string) => void;
  onNavigateToOptimizer: (targetFacId: string, medId: string) => void;
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({
  facilities,
  language,
  onSelectFacility,
  onNavigateToOptimizer
}) => {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('FAC-UP-LKO-01');

  // Group facilities by tier
  const phcs = facilities.filter(f => f.facilityType === 'PHC');
  const chcs = facilities.filter(f => f.facilityType === 'CHC');
  const districtHospitals = facilities.filter(f => f.facilityType === 'DISTRICT_HOSPITAL');

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId) || facilities[0];

  const upstreamNode = facilities.find(
    f => f.district === selectedFacility.district && f.facilityType === 'DISTRICT_HOSPITAL' && f.id !== selectedFacility.id
  ) || chcs.find(f => f.district === selectedFacility.district && f.id !== selectedFacility.id);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Network className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {t('digitalTwin', language)}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Interactive topological health network twin: PHC → CHC → District Hospital → State Depot.
          Observe referral cascades, bed load propagation, and resource dependencies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Network Hierarchy Topology View (Left 8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center justify-between">
              <span>Healthcare Network Hierarchy Tiers</span>
              <span className="text-[11px] text-slate-400 font-normal">Click any node to inspect profile</span>
            </h3>

            {/* Tier 3: District Hospitals */}
            <div className="space-y-2.5 mb-6">
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                <span>Tier 3: District Referral Hospitals (Secondary / Tertiary Triage)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {districtHospitals.slice(0, 4).map((fac) => {
                  const isSelected = fac.id === selectedFacilityId;
                  return (
                    <div
                      key={fac.id}
                      onClick={() => setSelectedFacilityId(fac.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/40 border-blue-600 shadow-xs ring-1 ring-blue-600/30'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900 text-xs truncate">{fac.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          fac.overallRiskLevel === 'RED' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {fac.overallRiskLevel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5">
                        <span>{fac.district}</span>
                        <span className={fac.bedOccupancyRate >= 85 ? 'text-amber-700 font-semibold' : ''}>
                          Beds: {fac.bedsOccupied}/{fac.bedsTotal} ({fac.bedOccupancyRate}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connecting Pipe */}
            <div className="flex justify-center my-2 text-slate-400 text-xs font-medium">
              ↓ Upstream Referral &amp; Downstream Supply Channels ↓
            </div>

            {/* Tier 2: Community Health Centres */}
            <div className="space-y-2.5 mb-6">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span>Tier 2: Community Health Centres (CHC Buffer Depots)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {chcs.slice(0, 4).map((fac) => {
                  const isSelected = fac.id === selectedFacilityId;
                  return (
                    <div
                      key={fac.id}
                      onClick={() => setSelectedFacilityId(fac.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/40 border-blue-600 shadow-xs ring-1 ring-blue-600/30'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900 text-xs truncate">{fac.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          fac.overallRiskLevel === 'RED' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {fac.overallRiskLevel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5">
                        <span>{fac.district}</span>
                        <span className="font-medium text-slate-700">Surplus ORS: {fac.medicines.find(m => m.medicineId === 'MED-ORS')?.stockQuantity.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connecting Pipe */}
            <div className="flex justify-center my-2 text-slate-400 text-xs font-medium">
              ↓ Primary Outpatient Intake &amp; First-Line Community Care ↓
            </div>

            {/* Tier 1: Primary Health Centres */}
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-purple-700 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-purple-600" />
                <span>Tier 1: Primary Health Centres (PHC Frontline)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {phcs.slice(0, 4).map((fac) => {
                  const isSelected = fac.id === selectedFacilityId;
                  return (
                    <div
                      key={fac.id}
                      onClick={() => setSelectedFacilityId(fac.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/40 border-blue-600 shadow-xs ring-1 ring-blue-600/30'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900 text-xs truncate">{fac.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          fac.overallRiskLevel === 'RED' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {fac.overallRiskLevel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5">
                        <span>{fac.district}</span>
                        <span className="text-red-600 font-semibold">
                          ORS: {fac.medicines.find(m => m.medicineId === 'MED-ORS')?.daysUntilStockout}d left
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Facility Deep Profile & Connected Ripple Panel (Right 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {selectedFacility.facilityType}
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-2">
                  {selectedFacility.name}
                </h3>
                <span className="text-xs text-slate-500">
                  {selectedFacility.district}, {selectedFacility.state}
                </span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                selectedFacility.overallRiskLevel === 'RED'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {selectedFacility.overallRiskLevel}
              </span>
            </div>

            {/* Vital Signs Cards */}
            <div className="grid grid-cols-2 gap-2.5 my-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[10px] font-medium">Bed Load</span>
                <span className="font-bold text-slate-900">
                  {selectedFacility.bedsOccupied} / {selectedFacility.bedsTotal} ({selectedFacility.bedOccupancyRate}%)
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[10px] font-medium">Staff Attendance</span>
                <span className="font-bold text-slate-900">
                  {selectedFacility.staffAvailable} / {selectedFacility.staffRequired}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[10px] font-medium">Today&apos;s Footfall</span>
                <span className="font-bold text-slate-900">
                  {selectedFacility.patientsToday} Patients
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[10px] font-medium">Data Reliability</span>
                <span className="font-bold text-emerald-700">
                  {selectedFacility.dataReliabilityScore}%
                </span>
              </div>
            </div>

            {/* Network Ripple Effect Insight */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs space-y-2 mb-4">
              <div className="flex items-center space-x-1.5 text-blue-700 font-bold">
                <Info className="h-4 w-4" />
                <span>Inter-tier Ripple Effect:</span>
              </div>
              {upstreamNode && (
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  If {selectedFacility.name} exhausts critical rehydration supplies, ~{Math.round(selectedFacility.patientsToday * 0.45)} emergency patient referrals will spill upstream to <strong>{upstreamNode.name}</strong> within 48 hours, raising its bed occupancy by +15%.
                </p>
              )}
            </div>

            {/* Inventory Snapshot */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-700 text-xs block">
                Medicine Stock Coverage:
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {selectedFacility.medicines.map((m) => (
                  <div
                    key={m.medicineId}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <span className="text-slate-800 text-xs truncate max-w-[150px] font-medium">{m.name}</span>
                    <div className="text-right">
                      <span className={`font-bold ${
                        (m.daysUntilStockout || 0) <= 4 ? 'text-red-600' : 'text-slate-700'
                      }`}>
                        {m.daysUntilStockout}d
                      </span>
                      <span className="text-[10px] text-slate-400 block">({m.stockQuantity} {m.unit})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action */}
            <button
              type="button"
              onClick={() => onNavigateToOptimizer(selectedFacility.id, 'MED-ORS')}
              className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <Package className="h-4 w-4" />
              <span>Redistribute Supplies to this Node</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
