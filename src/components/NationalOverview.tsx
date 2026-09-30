import React, { useState } from 'react';
import {
  Building2,
  AlertTriangle,
  Bed,
  Users,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Search,
  CheckCircle2,
  Sparkles,
  MapPin,
  Package,
  Layers
} from 'lucide-react';
import { Facility, AlertItem, SupportedLanguage } from '../types';
import { t } from '../utils/translations';

interface NationalOverviewProps {
  facilities: Facility[];
  alerts: AlertItem[];
  language: SupportedLanguage;
  onSelectFacility: (facId: string) => void;
  onNavigateToOptimizer: (targetFacId: string, medId: string) => void;
  onOpenCopilot: (initialPrompt?: string) => void;
  selectedState: string;
  onSelectState: (state: string) => void;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
}

export const NationalOverview: React.FC<NationalOverviewProps> = ({
  facilities,
  alerts,
  language,
  onSelectFacility,
  onNavigateToOptimizer,
  onOpenCopilot,
  selectedState,
  onSelectState,
  selectedDistrict,
  onSelectDistrict
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Extract unique states and districts
  const states = Array.from(new Set(facilities.map(f => f.state)));
  const availableDistricts = Array.from(
    new Set(
      facilities
        .filter(f => selectedState === 'ALL' || f.state === selectedState)
        .map(f => f.district)
    )
  );

  // Filter facilities
  const filteredFacilities = facilities.filter(f => {
    if (selectedState !== 'ALL' && f.state !== selectedState) return false;
    if (selectedDistrict !== 'ALL' && f.district !== selectedDistrict) return false;
    if (typeFilter !== 'ALL' && f.facilityType !== typeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        f.name.toLowerCase().includes(term) ||
        f.district.toLowerCase().includes(term) ||
        f.medicines.some(m => m.name.toLowerCase().includes(term))
      );
    }
    return true;
  });

  // Calculate aggregated KPIs
  const totalMonitored = facilities.length;
  const criticalFacilitiesCount = facilities.filter(f => f.overallRiskLevel === 'RED').length;
  const criticalStockoutCount = facilities.reduce((sum, f) => sum + f.criticalMedicinesCount, 0);
  const bedStressCount = facilities.filter(f => f.bedOccupancyRate >= 85).length;
  const workforceGapTotal = facilities.reduce((sum, f) => sum + f.staffShortage, 0);

  return (
    <div className="space-y-6">
      {/* Top SaaS KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-medium">
            <span>{t('monitoredFacilities', language)}</span>
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{totalMonitored}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            5 States • 15 Districts
          </div>
        </div>

        {/* Metric 2: Critical Stockouts */}
        <div className={`p-4 rounded-xl border shadow-xs transition-colors ${
          criticalStockoutCount > 0
            ? 'bg-red-50/50 border-red-200'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-medium">
            <span className={criticalStockoutCount > 0 ? 'text-red-700 font-semibold' : ''}>
              {t('criticalStockouts', language)}
            </span>
            <AlertTriangle className={`h-4 w-4 ${criticalStockoutCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-bold tracking-tight ${criticalStockoutCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {criticalStockoutCount}
          </div>
          <div className={`text-xs font-medium mt-1 ${criticalStockoutCount > 0 ? 'text-red-700' : 'text-slate-500'}`}>
            Across {criticalFacilitiesCount} Facilities
          </div>
        </div>

        {/* Metric 3: Bed Stress */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-medium">
            <span>{t('bedStress', language)}</span>
            <Bed className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{bedStressCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Occupancy &gt; 85%
          </div>
        </div>

        {/* Metric 4: Workforce Gaps */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-medium">
            <span>{t('workforceGaps', language)}</span>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{workforceGapTotal}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Personnel Deficit
          </div>
        </div>

        {/* Metric 5: Federated State Nodes */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-medium">
            <span>{t('federatedStates', language)}</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">5 / 5</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            Active Edge Nodes
          </div>
        </div>
      </div>

      {/* Primary Alert Banner if critical shortages detected */}
      {alerts.length > 0 && (
        <div className="bg-white border-l-4 border-l-red-600 border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-red-100 text-red-600 rounded-xl mt-0.5 flex-shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                    {alerts[0].severity}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {alerts[0].title}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  {alerts[0].why}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onNavigateToOptimizer(alerts[0].facilityId, 'MED-ORS')}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
              >
                <span>{t('runOptimizer', language)}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onOpenCopilot(`Why is ${alerts[0].facilityName} at risk for ${alerts[0].title}?`)}
                className="flex items-center justify-center space-x-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>{t('askGemini', language)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        {/* State Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-slate-500 font-semibold">{t('selectState', language)}:</label>
          <select
            value={selectedState}
            onChange={(e) => {
              onSelectState(e.target.value);
              onSelectDistrict('ALL');
            }}
            className="bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
          >
            <option value="ALL">{t('allStates', language)}</option>
            {states.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* District Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-slate-500 font-semibold">{t('selectDistrict', language)}:</label>
          <select
            value={selectedDistrict}
            onChange={(e) => onSelectDistrict(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
          >
            <option value="ALL">{t('allDistricts', language)}</option>
            {availableDistricts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(['ALL', 'PHC', 'CHC', 'DISTRICT_HOSPITAL'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1.5 rounded-md transition-colors font-medium text-xs ${
                typeFilter === type
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type === 'ALL' ? 'All Types' : type.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px] flex-1 max-w-xs">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search facility or medicine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFacilities.map((fac) => {
          const isCritical = fac.overallRiskLevel === 'RED';
          const isOrange = fac.overallRiskLevel === 'ORANGE';
          const isYellow = fac.overallRiskLevel === 'YELLOW';

          const riskBadgeClass = isCritical
            ? 'bg-red-50 text-red-700 border-red-200'
            : isOrange
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : isYellow
            ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200';

          const criticalMeds = fac.medicines.filter(m => m.riskLevel === 'RED' || m.riskLevel === 'ORANGE');

          return (
            <div
              key={fac.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs transition-all hover:border-blue-200 hover:shadow-sm flex flex-col justify-between ${
                isCritical ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {fac.facilityType.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-0.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {fac.district}, {fac.state}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-1.5 leading-snug">
                      {fac.name}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${riskBadgeClass}`}>
                    {fac.overallRiskLevel}
                  </span>
                </div>

                {/* Key Capacity Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 my-3 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Bed Occupancy</span>
                    <span className={`font-semibold ${fac.bedOccupancyRate >= 85 ? 'text-amber-700' : 'text-slate-800'}`}>
                      {fac.bedsOccupied}/{fac.bedsTotal} ({fac.bedOccupancyRate}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Footfall Today</span>
                    <span className="font-semibold text-slate-800">
                      {fac.patientsToday} pts
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Staff Gap</span>
                    <span className={`font-semibold ${fac.staffShortage > 0 ? 'text-purple-700' : 'text-slate-800'}`}>
                      {fac.staffShortage > 0 ? `-${fac.staffShortage}` : 'Adequate'}
                    </span>
                  </div>
                </div>

                {/* Medicine Risk Spotlight */}
                <div className="space-y-1.5 mb-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Critical Medicine Status:
                  </span>
                  {criticalMeds.length > 0 ? (
                    <div className="space-y-1">
                      {criticalMeds.slice(0, 2).map((m) => (
                        <div
                          key={m.medicineId}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className={`h-2 w-2 rounded-full ${m.riskLevel === 'RED' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                            <span className="font-medium text-slate-800 truncate">{m.name}</span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <span className={`font-bold ${m.riskLevel === 'RED' ? 'text-red-600' : 'text-amber-600'}`}>
                              {m.daysUntilStockout}d stock
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ({m.stockQuantity} {m.unit})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>All 10 core medicines at safe buffer (&gt;14 days)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectFacility(fac.id)}
                  className="text-slate-600 hover:text-blue-600 font-semibold flex items-center space-x-1 transition-colors"
                >
                  <span>Facility Profile</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                {criticalMeds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onNavigateToOptimizer(fac.id, criticalMeds[0].medicineId)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-semibold transition-colors text-[11px] flex items-center space-x-1 shadow-xs"
                  >
                    <Package className="h-3 w-3" />
                    <span>Redistribute</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
