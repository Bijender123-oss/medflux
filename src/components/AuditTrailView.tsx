import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  Hash,
  Filter,
  Search
} from 'lucide-react';
import { AuditRecord, TransferOrder, SupportedLanguage } from '../types';
import { t } from '../utils/translations';

interface AuditTrailViewProps {
  auditLogs: AuditRecord[];
  transferOrders: TransferOrder[];
  language: SupportedLanguage;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  auditLogs,
  transferOrders,
  language
}) => {
  const [activeTab, setActiveTab] = useState<'TRANSFERS' | 'AUDIT_LOGS'>('TRANSFERS');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransfers = transferOrders.filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.id.toLowerCase().includes(term) ||
      t.sourceFacilityName.toLowerCase().includes(term) ||
      t.destinationFacilityName.toLowerCase().includes(term) ||
      t.medicineName.toLowerCase().includes(term)
    );
  });

  const filteredLogs = auditLogs.filter(l => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.id.toLowerCase().includes(term) ||
      l.action.toLowerCase().includes(term) ||
      l.userName.toLowerCase().includes(term) ||
      l.reason.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {t('auditTrail', language)}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Immutable cryptographic ledger recording all human-in-the-loop approvals, emergency simulations, transfer dispatches, and federated learning rounds.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('TRANSFERS')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'TRANSFERS'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transfer Orders ({transferOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('AUDIT_LOGS')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'AUDIT_LOGS'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              System Audit Log ({auditLogs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Transfer Orders Tab */}
      {activeTab === 'TRANSFERS' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Order ID &amp; Time</th>
                  <th className="py-3.5 px-4">Commodity &amp; Quantity</th>
                  <th className="py-3.5 px-4">Source (Donor)</th>
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4">Transit Distance</th>
                  <th className="py-3.5 px-4">Coverage Gain</th>
                  <th className="py-3.5 px-4">Authorized By</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransfers.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{order.id}</div>
                      <span className="text-[10px] text-slate-400">{order.approvalTimestamp || order.createdAt}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-blue-600">
                        {order.quantity.toLocaleString()} {order.unit}
                      </div>
                      <span className="text-[10px] text-slate-500">{order.medicineName}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{order.sourceFacilityName}</div>
                      <span className="text-[10px] text-slate-400">{order.sourceDistrict}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{order.destinationFacilityName}</div>
                      <span className="text-[10px] text-slate-400">{order.destinationDistrict}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {order.distanceKm} km (~{order.estimatedTransportHours}h)
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-700 font-bold">
                        +{order.coverageExtensionDays} Days
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{order.approvedBy || 'System Authorized'}</div>
                      <span className="text-[10px] text-slate-400">{order.approvedRole}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Audit Log Tab */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Audit ID &amp; Time</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">User &amp; Role</th>
                  <th className="py-3.5 px-4">Source &amp; Destination</th>
                  <th className="py-3.5 px-4">Reason / Rationale</th>
                  <th className="py-3.5 px-4 font-mono">Ledger Hash</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{log.id}</div>
                      <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{log.action}</span>
                      <span className="text-[10px] text-slate-400 block">{log.resourceType}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{log.userName}</div>
                      <span className="text-[10px] text-slate-400">{log.userRole}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 truncate max-w-[180px] font-medium">{log.source}</div>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">→ {log.destination}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {log.reason}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                      {log.hash}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
