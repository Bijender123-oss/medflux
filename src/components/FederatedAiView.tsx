import React, { useState } from 'react';
import {
  TrendingUp,
  Cpu,
  Layers,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Server
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { FederatedLearningStatus, SupportedLanguage } from '../types';
import { t } from '../utils/translations';

interface FederatedAiViewProps {
  federatedStatus: FederatedLearningStatus;
  onRunFederatedRound: () => Promise<void>;
  language: SupportedLanguage;
}

export const FederatedAiView: React.FC<FederatedAiViewProps> = ({
  federatedStatus,
  onRunFederatedRound,
  language
}) => {
  const [isRunning, setIsRunning] = useState(false);

  const handleRunRound = async () => {
    setIsRunning(true);
    await onRunFederatedRound();
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Cpu className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {t('federatedAi', language)}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              {t('disclaimer', language)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunRound}
            disabled={isRunning}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold text-xs transition-colors flex items-center space-x-2 shadow-xs disabled:opacity-50"
          >
            <RotateCcw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Aggregating State Weights...' : t('runFederatedRound', language)}</span>
          </button>
        </div>

        {/* Global Model Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[10px] font-semibold">{t('globalModelVersion', language)}</span>
            <span className="font-bold text-slate-900 text-sm font-mono">{federatedStatus.globalModelVersion}</span>
            <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">Round #{federatedStatus.roundNumber}</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[10px] font-semibold">{t('convergenceLoss', language)}</span>
            <span className="font-bold text-emerald-600 text-sm font-mono">{federatedStatus.globalLoss}</span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">Optimal Parameter Stability</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[10px] font-semibold">Participating State Nodes</span>
            <span className="font-bold text-slate-900 text-sm">{federatedStatus.totalParticipatingStates} States</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{federatedStatus.totalFacilitiesCovered} Facilities Aggregated</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[10px] font-semibold">Last Global Aggregation</span>
            <span className="font-semibold text-slate-800 text-xs">{federatedStatus.lastAggregatedAt}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">FedAvg Server Weighting</span>
          </div>
        </div>
      </div>

      {/* Global Parameters & Convergence Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Convergence Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-1">
            FedAvg Model Convergence Curve
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Cross-state edge loss descent across training rounds. Only gradient updates leave the state boundary.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={federatedStatus.convergenceLossHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="round" stroke="#94a3b8" tick={{ fontSize: 11 }} label={{ value: 'Federated Round', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={['dataMin - 0.01', 'dataMax + 0.01']} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="globalLoss" name="Global Aggregated Loss" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="avgLocalLoss" name="Average Local Edge Loss" stroke="#16a34a" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Parameters Card (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center space-x-1.5">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>Global Shared Parameters</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Synchronized model parameters broadcast back to edge state nodes:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Demand Elasticity:</span>
                <span className="font-mono font-bold text-blue-600 text-sm">
                  {federatedStatus.globalParameters.demandElasticity}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Seasonal Drift Factor:</span>
                <span className="font-mono font-bold text-blue-600 text-sm">
                  {federatedStatus.globalParameters.seasonalDrift}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Lead-Time Sensitivity:</span>
                <span className="font-mono font-bold text-blue-600 text-sm">
                  {federatedStatus.globalParameters.leadTimeSensitivity}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <span className="text-slate-600 font-medium">Outbreak Coefficient:</span>
                <span className="font-mono font-bold text-blue-600 text-sm">
                  {federatedStatus.globalParameters.outbreakCoefficient}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800 font-medium flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Edge nodes maintain local raw health data; only model weights and loss gradients are shared.</span>
          </div>
        </div>
      </div>

      {/* State Node Grid */}
      <div>
        <h3 className="font-bold text-slate-900 text-sm mb-3">
          Participating State Edge Nodes ({federatedStatus.stateNodes.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">
          {federatedStatus.stateNodes.map((node) => (
            <div
              key={node.stateName}
              className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-slate-900 text-sm">{node.stateName}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                    {node.localModelVersion}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block mb-3 font-medium">
                  {node.facilityCount} Facilities • {node.recordsProcessed.toLocaleString()} records
                </span>

                <div className="space-y-1.5 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Local Loss:</span>
                    <span className="font-mono text-emerald-700 font-semibold">{node.localLoss}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">FedAvg Weight:</span>
                    <span className="font-semibold text-slate-800">{node.contributionPct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Elasticity:</span>
                    <span className="font-mono text-slate-700">{node.parameters.demandElasticity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Outbreak Coeff:</span>
                    <span className="font-mono text-slate-700">{node.parameters.outbreakCoefficient}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center space-x-1 pt-2 border-t border-slate-100">
                <Clock className="h-3 w-3" />
                <span>{node.lastTrainingTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
