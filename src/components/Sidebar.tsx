import React from 'react';
import {
  LayoutDashboard,
  Sliders,
  Package,
  Network,
  Cpu,
  Calendar,
  ShieldCheck,
  FileText,
  Activity,
  LogOut,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';
import { UserRoleProfile, SupportedLanguage } from '../types';
import { t } from '../utils/translations';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentRole: UserRoleProfile;
  onLogout: () => void;
  language: SupportedLanguage;
  criticalAlertCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentRole,
  onLogout,
  language,
  criticalAlertCount,
  isOpenMobile,
  onCloseMobile
}) => {
  const navItems = [
    {
      id: 'overview',
      label: t('nationalOverview', language),
      icon: LayoutDashboard,
      badge: criticalAlertCount > 0 ? `${criticalAlertCount}` : undefined,
      badgeType: 'critical'
    },
    {
      id: 'simulator',
      label: t('emergencySimulator', language),
      icon: Sliders
    },
    {
      id: 'optimizer',
      label: t('redistributionOptimizer', language),
      icon: Package
    },
    {
      id: 'digital_twin',
      label: t('digitalTwin', language),
      icon: Network
    },
    {
      id: 'federated',
      label: t('federatedAi', language),
      icon: Cpu
    },
    {
      id: 'expiry',
      label: t('expiryIntelligence', language),
      icon: Calendar
    },
    {
      id: 'reliability',
      label: t('dataReliability', language),
      icon: ShieldCheck
    },
    {
      id: 'audit',
      label: t('auditTrail', language),
      icon: FileText
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Activity className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-slate-900 block leading-none">
                  MediFlux AI
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                  Healthcare Intelligence
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1">
            <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Management Modules
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* User Profile & Logout Section at Bottom */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs mb-2">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {currentRole.name.charAt(3) || 'U'}
              </div>
              <div className="text-left truncate">
                <div className="font-semibold text-xs text-slate-900 truncate">
                  {currentRole.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {currentRole.role.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
