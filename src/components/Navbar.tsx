import React from 'react';
import { Activity, ShieldCheck, Globe, User, Sparkles, AlertCircle } from 'lucide-react';
import { UserRoleProfile, SupportedLanguage } from '../types';
import { t } from '../utils/translations';

interface NavbarProps {
  currentRole: UserRoleProfile;
  onRoleChange: (role: UserRoleProfile) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  hasGeminiKey: boolean;
  criticalAlertCount: number;
}

export const USER_ROLES: UserRoleProfile[] = [
  {
    id: 'ROLE-PHC',
    name: 'Dr. Rajesh Sharma',
    role: 'PHC_OFFICER',
    designation: 'Medical Officer, PHC Lucknow Rural',
    assignedFacilityId: 'FAC-UP-LKO-01',
    assignedDistrict: 'Lucknow',
    assignedState: 'Uttar Pradesh'
  },
  {
    id: 'ROLE-DHO',
    name: 'Dr. Sunita Verma',
    role: 'DISTRICT_OFFICER',
    designation: 'Chief Medical Officer (CMO), Lucknow',
    assignedDistrict: 'Lucknow',
    assignedState: 'Uttar Pradesh'
  },
  {
    id: 'ROLE-STATE',
    name: 'Sri Alok Saxena',
    role: 'STATE_ADMIN',
    designation: 'Director, National Health Mission (UP)',
    assignedState: 'Uttar Pradesh'
  },
  {
    id: 'ROLE-NAT',
    name: 'Dr. K. Swaminathan',
    role: 'NATIONAL_ADMIN',
    designation: 'Advisor, National Health Authority (NHA)'
  }
];

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  language,
  onLanguageChange,
  hasGeminiKey,
  criticalAlertCount
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="h-6 w-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-white">
                  {t('appTitle', language)}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Govt of India Prototype
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {t('appTagline', language)}
              </p>
            </div>
          </div>

          {/* Right Tools & Badges */}
          <div className="flex items-center space-x-3">
            {/* Gemini Status Badge */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              <span>{t('poweredBy', language)}</span>
              {hasGeminiKey && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Gemini API Connected" />
              )}
            </div>

            {/* Critical Alert Indicator */}
            {criticalAlertCount > 0 && (
              <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{criticalAlertCount} {language === 'hi' ? 'गंभीर' : 'Critical'}</span>
              </div>
            )}

            {/* Language Selector */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('hi')}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  language === 'hi'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* Role Dropdown */}
            <div className="relative">
              <div className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs cursor-pointer">
                <User className="h-4 w-4 text-emerald-400" />
                <div className="text-left">
                  <div className="font-semibold text-slate-200 leading-tight">
                    {currentRole.name}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {currentRole.role.replace('_', ' ')}
                  </div>
                </div>
                <select
                  value={currentRole.id}
                  onChange={(e) => {
                    const selected = USER_ROLES.find(r => r.id === e.target.value);
                    if (selected) onRoleChange(selected);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  {USER_ROLES.map((role) => (
                    <option key={role.id} value={role.id} className="bg-slate-900 text-white">
                      {role.name} - {role.designation}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
