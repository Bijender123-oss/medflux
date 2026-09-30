import React, { useState } from 'react';
import {
  Flame,
  Sliders,
  Sparkles,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Bed,
  Users,
  Package
} from 'lucide-react';
import { Facility, SimulationParams, SupportedLanguage } from '../types';
import { t } from '../utils/translations';

interface EmergencySimulatorProps {
  facilities: Facility[];
  activeSimulation: SimulationParams | null;
  onApplySimulation: (params: SimulationParams) => Promise<void>;
  onResetSimulation: () => Promise<void>;
  language: SupportedLanguage;
}

export const EmergencySimulator: React.FC<EmergencySimulatorProps> = ({
  facilities,
  activeSimulation,
  onApplySimulation,
  onResetSimulation,
  language
}) => {
  // Local slider states
  const [patientIncrease, setPatientIncrease] = useState<number>(
    activeSimulation?.patientDemandIncreasePct || 40
  );
  const [medicineIncrease, setMedicineIncrease] = useState<number>(
    activeSimulation?.medicineDemandIncreasePct || 65
  );
  const [supplierDelay, setSupplierDelay] = useState<number>(
    activeSimulation?.supplierDelayDays || 6
  );
  const [staffAvailability, setStaffAvailability] = useState<number>(
    activeSimulation?.staffAvailabilityPct || 85
  );
  const [bedAdjustment, setBedAdjustment] = useState<number>(
    activeSimulation?.bedCapacityAdjustmentPct || 25
  );
  const [scenarioName, setScenarioName] = useState<string>(
    activeSimulation?.scenarioName || 'Dengue Outbreak Surge'
  );

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Before vs After calculated metrics
  const totalPatientsBefore = facilities.reduce((sum, f) => sum + f.patients7DayAverage, 0);
  const totalPatientsAfter = Math.round(totalPatientsBefore * (1 + patientIncrease / 100));

  const criticalMedsBefore = 2; // Baseline seeded critical count
  const criticalMedsAfter = Math.min(
    facilities.length * 4,
    Math.round(criticalMedsBefore + (patientIncrease * 0.12) + (supplierDelay * 0.6))
  );

  const avgBedOccupancyBefore = 72;
  const avgBedOccupancyAfter = Math.min(98, Math.round(avgBedOccupancyBefore + (patientIncrease * 0.35) + (bedAdjustment * 0.2)));

  const staffShortageBefore = facilities.reduce((sum, f) => sum + f.staffShortage, 0);
  const staffShortageAfter = Math.round(staffShortageBefore + (facilities.length * (1 - staffAvailability / 100) * 1.5));

  const handleApply = async () => {
    setIsApplying(true);
    const params: SimulationParams = {
      scenarioName,
      patientDemandIncreasePct: patientIncrease,
      medicineDemandIncreasePct: medicineIncrease,
      supplierDelayDays: supplierDelay,
      staffAvailabilityPct: staffAvailability,
      bedCapacityAdjustmentPct: bedAdjustment,
      affectedDiseases: [scenarioName.split(' ')[0] || 'Viral Outbreak']
    };

    await onApplySimulation(params);
    setIsApplying(false);

    // Call Gemini for scenario insights
    fetchAiInsights();
  };

  const fetchAiInsights = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/gemini/simulation-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioName,
          beforeStats: {
            totalPatients: totalPatientsBefore,
            criticalMeds: criticalMedsBefore,
            avgBedOccupancy: avgBedOccupancyBefore,
            staffShortage: staffShortageBefore
          },
          afterStats: {
            totalPatients: totalPatientsAfter,
            patientDiffPct: patientIncrease,
            criticalMeds: criticalMedsAfter,
            avgBedOccupancy: avgBedOccupancyAfter,
            staffShortage: staffShortageAfter
          },
          language
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.text);
      }
    } catch (err) {
      console.error('Failed to get simulation insights:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const loadPreset = (
    name: string,
    pInc: number,
    mInc: number,
    sDelay: number,
    staffAvail: number,
    bedAdj: number
  ) => {
    setScenarioName(name);
    setPatientIncrease(pInc);
    setMedicineIncrease(mInc);
    setSupplierDelay(sDelay);
    setStaffAvailability(staffAvail);
    setBedAdjustment(bedAdj);
  };

  return (
    <div className="space-y-6">
      {/* Title Header Card */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Sliders className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {t('emergencySimulator', language)}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate epidemic shocks, seasonal infection surges, supplier logistics failures, and workforce crises.
          </p>
        </div>

        {/* Preset Chips */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => loadPreset('Dengue Outbreak Surge', 40, 65, 6, 85, 25)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition-colors"
          >
            Dengue (+40%)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('Heatwave & Dehydration Emergency', 50, 100, 4, 90, 20)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition-colors"
          >
            Heatwave (+50%)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('Monsoon Flood & Waterborne Shock', 60, 90, 14, 75, 35)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition-colors"
          >
            Flood (+60%)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('Seasonal Respiratory Surge', 30, 45, 3, 95, 10)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium transition-colors"
          >
            Seasonal Viral (+30%)
          </button>
        </div>
      </div>

      {/* Main Grid: Controls on Left, Impact Assessment on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Panel */}
        <div className="lg:col-span-6 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5">
          <h3 className="font-bold text-slate-900 text-sm">
            Outbreak &amp; Stress Parameters
          </h3>

          {/* Scenario Name */}
          <div>
            <label className="text-xs text-slate-700 block font-semibold mb-1.5">
              Scenario Name / Description:
            </label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
            />
          </div>

          {/* Patient Demand Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-700 font-semibold">Patient Footfall Increase:</span>
              <span className="font-bold text-blue-600">+{patientIncrease}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={patientIncrease}
              onChange={(e) => setPatientIncrease(Number(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Surges primary triage load across all PHCs/CHCs</span>
          </div>

          {/* Medicine Demand Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-700 font-semibold">Medicine Consumption Velocity:</span>
              <span className="font-bold text-blue-600">+{medicineIncrease}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={medicineIncrease}
              onChange={(e) => setMedicineIncrease(Number(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Accelerates depletion of ORS, IV fluids, and fever antipyretics</span>
          </div>

          {/* Supplier Lead Delay */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-700 font-semibold">Supplier Lead-Time Delay:</span>
              <span className="font-bold text-amber-600">+{supplierDelay} Days</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={supplierDelay}
              onChange={(e) => setSupplierDelay(Number(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Factory and transport bottleneck delay on pending orders</span>
          </div>

          {/* Staff Availability */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-700 font-semibold">Healthcare Staff Availability:</span>
              <span className="font-bold text-purple-600">{staffAvailability}% of Normal</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={staffAvailability}
              onChange={(e) => setStaffAvailability(Number(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Workforce absenteeism, sick leave, or deployment strain</span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-3">
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-xs"
            >
              <TrendingUp className="h-4 w-4" />
              <span>{isApplying ? 'Recalculating Network...' : 'Apply Simulation & Recalculate'}</span>
            </button>

            <button
              type="button"
              onClick={onResetSimulation}
              className="py-3 px-3.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
              title="Reset Simulation"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Before vs After Difference Panel (Right 6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4">
              Statewide Impact Matrix: Before vs After
            </h3>

            <div className="space-y-3 text-xs">
              {/* Metric 1 */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Total Monitored Patient Footfall</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-slate-500">{totalPatientsBefore.toLocaleString()} pts</span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="font-bold text-slate-900 text-sm">{totalPatientsAfter.toLocaleString()} pts</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                  +{patientIncrease}% Surge
                </span>
              </div>

              {/* Metric 2 */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Critical Medicine Stock-Outs</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-slate-500">{criticalMedsBefore} commodities</span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="font-bold text-red-600 text-sm">{criticalMedsAfter} commodities</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
                  +{criticalMedsAfter - criticalMedsBefore} Outages
                </span>
              </div>

              {/* Metric 3 */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Average Bed Occupancy Rate</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-slate-500">{avgBedOccupancyBefore}%</span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="font-bold text-amber-700 text-sm">{avgBedOccupancyAfter}%</span>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                  avgBedOccupancyAfter >= 88 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  +{avgBedOccupancyAfter - avgBedOccupancyBefore}% Stress
                </span>
              </div>

              {/* Metric 4 */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Workforce Deficit</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-slate-500">{staffShortageBefore} staff</span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="font-bold text-purple-700 text-sm">{staffShortageAfter} staff</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-md">
                  +{staffShortageAfter - staffShortageBefore} Gap
                </span>
              </div>
            </div>
          </div>

          {/* Gemini AI Strategic Insights Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Gemini Outbreak Intelligence
                </h3>
              </div>
              <button
                type="button"
                onClick={fetchAiInsights}
                disabled={isLoadingAi}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
              >
                <span>{isLoadingAi ? 'Analyzing...' : 'Refresh AI Analysis'}</span>
              </button>
            </div>

            {isLoadingAi ? (
              <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
                <Sparkles className="h-5 w-5 text-blue-600 animate-spin" />
                <span>Evaluating epidemiological shock with Gemini...</span>
              </div>
            ) : aiAnalysis ? (
              <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                {aiAnalysis}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                Click &quot;Apply Simulation &amp; Recalculate&quot; above to generate AI epidemiological interpretation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
