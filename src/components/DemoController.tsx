import React from 'react';
import { Flame, Droplets, Clock, Users, RotateCcw, AlertTriangle, Play } from 'lucide-react';
import { SimulationParams, SupportedLanguage } from '../types';
import { t } from '../utils/translations';

interface DemoControllerProps {
  activeSimulation: SimulationParams | null;
  onSimulate: (params: SimulationParams) => void;
  onReset: () => void;
  language: SupportedLanguage;
  isLoading?: boolean;
}

export const DemoController: React.FC<DemoControllerProps> = ({
  activeSimulation,
  onSimulate,
  onReset,
  language,
  isLoading
}) => {
  const triggerDengue = () => {
    onSimulate({
      scenarioName: 'Dengue Outbreak Surge (14-Day Forecast)',
      patientDemandIncreasePct: 40,
      medicineDemandIncreasePct: 65,
      supplierDelayDays: 6,
      staffAvailabilityPct: 85,
      bedCapacityAdjustmentPct: 25,
      affectedDiseases: ['Dengue', 'Viral Hemorrhagic Fever'],
      notes: 'Patient footfall increases +40%; ORS, IV fluids & Paracetamol demand increases up to +80%.'
    });
  };

  const triggerFlood = () => {
    onSimulate({
      scenarioName: 'Monsoon Flood & Waterborne Outbreak',
      patientDemandIncreasePct: 60,
      medicineDemandIncreasePct: 90,
      supplierDelayDays: 12,
      staffAvailabilityPct: 75,
      bedCapacityAdjustmentPct: 35,
      affectedDiseases: ['Cholera', 'Diarrheal', 'Typhoid'],
      notes: 'Flooding causes acute supply transport severance (+12 days lead delay); massive electrolyte & antibiotic demand spike.'
    });
  };

  const triggerSupplierDelay = () => {
    onSimulate({
      scenarioName: 'Severe Supply Chain Bottleneck (+14d Delay)',
      patientDemandIncreasePct: 15,
      medicineDemandIncreasePct: 20,
      supplierDelayDays: 14,
      staffAvailabilityPct: 95,
      bedCapacityAdjustmentPct: 0,
      affectedDiseases: ['General Inpatient'],
      notes: 'State pharmaceutical logistics strike triggers 14-day delay in all pending factory dispatches.'
    });
  };

  const triggerStaffShortage = () => {
    onSimulate({
      scenarioName: 'Acute Medical Workforce Deficit (60% Staff)',
      patientDemandIncreasePct: 20,
      medicineDemandIncreasePct: 25,
      supplierDelayDays: 2,
      staffAvailabilityPct: 60,
      bedCapacityAdjustmentPct: -15,
      affectedDiseases: ['General Inpatient'],
      notes: 'Staff absenteeism and epidemic infection among healthcare workers reduces operating capacity to 60%.'
    });
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 sm:px-6 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Title and Active indicator */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            {t('demoControls', language)}
          </span>
          {activeSimulation && (
            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-medium text-[11px] flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              {activeSimulation.scenarioName}
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={triggerDengue}
            disabled={isLoading}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSimulation?.scenarioName.includes('Dengue')
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Flame className={`h-3.5 w-3.5 ${activeSimulation?.scenarioName.includes('Dengue') ? 'text-white' : 'text-rose-500'}`} />
            <span>{t('simulateDengue', language)}</span>
          </button>

          <button
            type="button"
            onClick={triggerFlood}
            disabled={isLoading}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSimulation?.scenarioName.includes('Flood')
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Droplets className={`h-3.5 w-3.5 ${activeSimulation?.scenarioName.includes('Flood') ? 'text-white' : 'text-sky-500'}`} />
            <span>{t('simulateFlood', language)}</span>
          </button>

          <button
            type="button"
            onClick={triggerSupplierDelay}
            disabled={isLoading}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSimulation?.scenarioName.includes('Delay')
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Clock className={`h-3.5 w-3.5 ${activeSimulation?.scenarioName.includes('Delay') ? 'text-white' : 'text-amber-500'}`} />
            <span>{t('simulateSupplierDelay', language)}</span>
          </button>

          <button
            type="button"
            onClick={triggerStaffShortage}
            disabled={isLoading}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSimulation?.scenarioName.includes('Workforce')
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Users className={`h-3.5 w-3.5 ${activeSimulation?.scenarioName.includes('Workforce') ? 'text-white' : 'text-purple-500'}`} />
            <span>{t('simulateStaffShortage', language)}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span>{t('resetScenario', language)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
