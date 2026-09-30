import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  RefreshCw,
  Search
} from 'lucide-react';
import { Facility, SupportedLanguage } from '../types';
import { t } from '../utils/translations';

interface DataReliabilityProps {
  facilities: Facility[];
  language: SupportedLanguage;
}

export const DataReliabilityView: React.FC<DataReliabilityProps> = ({
  facilities,
  language
}) => {
  const avgReliability = Math.round(
    facilities.reduce((sum, f) => sum + f.dataReliabilityScore, 0) / facilities.length
  );
  const flaggedCount = facilities.filter(f => f.dataReliabilityScore < 90).length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {t('dataReliability', language)}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Automated telemetry verification engine: monitors data freshness, uncharacteristic inventory spikes, repeated unchanged stock levels, and missing shift reconciliations.
        </p>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Average Telemetry Score</span>
            <span className="font-bold text-blue-600 text-xl">{avgReliability}%</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Across all facilities</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            flaggedCount > 0 ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-100'
          }`}>
            <span className="text-amber-800 block text-[10px] uppercase font-bold tracking-wider">Verification Alerts</span>
            <span className="font-bold text-amber-700 text-xl">{flaggedCount} Facilities</span>
            <span className="text-[10px] text-amber-800 block mt-0.5">Reliability &lt; 90%</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Telemetry Freshness</span>
            <span className="font-bold text-slate-900 text-xl">100% Active</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Heartbeat updates &lt; 2 hrs</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Audit Protocol</span>
            <span className="font-bold text-slate-900 text-xl">Auto-Flagging</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Confidence interval adjusted</span>
          </div>
        </div>
      </div>

      {/* Facilities Audit Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Facility &amp; District</th>
                <th className="py-3.5 px-4">Reliability Score</th>
                <th className="py-3.5 px-4">Status &amp; Verification</th>
                <th className="py-3.5 px-4">Telemetry Freshness</th>
                <th className="py-3.5 px-4">Known Issues / Audit Notes</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {facilities.map((fac) => {
                const score = fac.dataReliabilityScore;
                const isFlagged = score < 90;
                const badgeClass = score >= 95
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : score >= 90
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200';

                return (
                  <tr key={fac.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{fac.name}</div>
                      <span className="text-[10px] text-slate-400">
                        {fac.facilityType} • {fac.district}, {fac.state}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-bold font-mono text-sm text-slate-900">{score}%</span>
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${score >= 90 ? 'bg-blue-600' : 'bg-amber-500'}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                        {score >= 95 ? 'OPTIMAL' : score >= 90 ? 'VERIFIED' : 'ATTENTION REQUIRED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{fac.lastUpdated}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {fac.dataReliabilityIssues.length > 0 ? (
                        <span className="text-amber-700 flex items-center gap-1 font-medium">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                          {fac.dataReliabilityIssues.join(', ')}
                        </span>
                      ) : (
                        <span className="text-emerald-700 flex items-center gap-1 text-[11px] font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                          Zero telemetry anomalies detected
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isFlagged ? (
                        <button
                          type="button"
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-amber-800 border border-slate-200 rounded-lg font-semibold text-[11px] transition-colors shadow-xs"
                        >
                          Request Re-verification
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">Audit OK</span>
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
