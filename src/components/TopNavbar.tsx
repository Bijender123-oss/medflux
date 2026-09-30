import React, { useState } from 'react';
import {
  Menu,
  Sparkles,
  User,
  Globe,
  Bell,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { UserRoleProfile, SupportedLanguage, SimulationParams } from '../types';
import { USER_ROLES } from './Navbar';
import { t } from '../utils/translations';

interface TopNavbarProps {
  currentRole: UserRoleProfile;
  onRoleChange: (role: UserRoleProfile) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  hasGeminiKey: boolean;
  onOpenMobileMenu: () => void;
  activeSimulation: SimulationParams | null;
  onResetSimulation: () => void;
  onOpenCopilot: () => void;
  activeTabTitle: string;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentRole,
  onRoleChange,
  language,
  onLanguageChange,
  hasGeminiKey,
  onOpenMobileMenu,
  activeSimulation,
  onResetSimulation,
  onOpenCopilot,
  activeTabTitle
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
      {/* Left: Mobile hamburger & Active Title */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
            {activeTabTitle}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            {t('appTagline', language)}
          </p>
        </div>
      </div>

      {/* Center/Right: Simulation status, Gemini badge, Language, Role switcher */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Active Simulation Pill if triggered */}
        {activeSimulation && (
          <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-fadeIn">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span className="truncate max-w-[160px]">{activeSimulation.scenarioName}</span>
            <button
              type="button"
              onClick={onResetSimulation}
              className="text-amber-700 hover:text-amber-900 ml-1"
              title="Reset Scenario"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Gemini Badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>Gemini 3.8 Flash</span>
          {hasGeminiKey && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Connected" />}
        </div>

        {/* AI Copilot Quick Launch Button */}
        <button
          type="button"
          onClick={onOpenCopilot}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-200" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Language Toggle */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              language === 'en'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('hi')}
            className={`px-2 py-1 rounded-md font-medium transition-colors ${
              language === 'hi'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            हिंदी
          </button>
        </div>

        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-xs text-left"
          >
            <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
              {currentRole.name.charAt(3) || 'U'}
            </div>
            <div className="hidden md:block">
              <div className="font-semibold text-slate-800 leading-tight">
                {currentRole.name}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                {currentRole.role.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Role Dropdown Menu */}
          {roleMenuOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs animate-fadeIn">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Operational Role
              </div>
              {USER_ROLES.map((role) => {
                const isSelected = currentRole.id === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      onRoleChange(role);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{role.name}</div>
                      <div className="text-[10px] text-slate-500">{role.designation}</div>
                    </div>
                    {isSelected && <ShieldCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
