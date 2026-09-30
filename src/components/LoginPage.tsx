import React, { useState } from 'react';
import {
  Activity,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Loader2
} from 'lucide-react';
import { UserRoleProfile } from '../types';
import { USER_ROLES } from './Navbar';

interface LoginPageProps {
  onLogin: (role: UserRoleProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('sunita.verma@health.gov.in');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRoleProfile>(USER_ROLES[1]); // Dr. Sunita Verma

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin(selectedRole);
    }, 600);
  };

  const handleQuickRoleSelect = (role: UserRoleProfile) => {
    setSelectedRole(role);
    if (role.role === 'PHC_OFFICER') setEmail('rajesh.sharma@phc.lucknow.gov.in');
    else if (role.role === 'DISTRICT_OFFICER') setEmail('sunita.verma@cmo.lucknow.gov.in');
    else if (role.role === 'STATE_ADMIN') setEmail('alok.saxena@nhm.up.gov.in');
    else setEmail('k.swaminathan@nha.gov.in');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Left Column: Professional Blue Branding Section (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle background circles for depth */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Logo */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="h-11 w-11 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-lg shadow-black/10">
            <Activity className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-white block">
              MediFlux AI
            </span>
            <span className="text-xs text-blue-100 font-medium tracking-wide">
              Healthcare Resource Intelligence Network
            </span>
          </div>
        </div>

        {/* Center Presentation Copy */}
        <div className="relative z-10 my-auto py-8 max-w-lg">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-50 border border-white/20 mb-6 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-blue-200" />
            <span>Powered by Google Gemini 3.8 Flash</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Predicting healthcare needs. Optimizing national medical resources.
          </h1>

          <p className="mt-4 text-blue-100 text-base leading-relaxed">
            Federated predictive intelligence connecting Primary Health Centres, Community Health Centres, and District Hospitals across India with zero centralized raw patient data migration.
          </p>

          {/* Key Value Prop List */}
          <div className="mt-8 space-y-3.5">
            <div className="flex items-start space-x-3">
              <div className="p-1 rounded-md bg-blue-500/30 text-white mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Deterministic Demand Forecasting</h4>
                <p className="text-xs text-blue-100">Evaluates 30-day velocity, trend multipliers, seasonal drift, and outbreak shocks.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-1 rounded-md bg-blue-500/30 text-white mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Multi-Criteria Redistribution Optimizer</h4>
                <p className="text-xs text-blue-100">Resolves critical stock-outs by transferring surplus stock from nearby facilities before emergency escalation.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-1 rounded-md bg-blue-500/30 text-white mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Privacy-Preserving Federated AI</h4>
                <p className="text-xs text-blue-100">Edge training across 5 Indian states with server-side FedAvg parameter aggregation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Indicators */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-blue-200">
          <span>Government of India Healthcare Prototype</span>
          <span>Version 2.4-SaaS</span>
        </div>
      </div>

      {/* Right Column: Clean White SaaS Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-[460px] bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10">
          {/* Mobile Header Logo */}
          <div className="flex items-center space-x-3 mb-8 lg:hidden">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block">
                MediFlux AI
              </span>
              <span className="text-xs text-slate-500">
                Healthcare Resource Intelligence
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome Back
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Sign in to continue to your healthcare management dashboard
            </p>
          </div>

          {/* Quick Demo Role Selector Pills (Crucial for Judges) */}
          <div className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
              Select Demo Role to Sign In:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {USER_ROLES.map((role) => {
                const isSelected = selectedRole.id === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleQuickRoleSelect(role)}
                    className={`text-left p-2 rounded-lg text-xs transition-all border ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-xs ring-1 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold truncate">{role.name.split(' ')[1] || role.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{role.role.replace('_', ' ')}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@health.gov.in"
                  className="w-full h-12 pl-10 pr-3.5 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-white"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 pl-10 pr-10 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember" className="ml-2 block text-xs text-slate-600">
                Remember this device for 30 days
              </label>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-slate-200" />
            <span className="px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
              Or Instant Access
            </span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Alternative Demo Login with Selected Role */}
          <button
            type="button"
            onClick={() => onLogin(selectedRole)}
            className="w-full h-11 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl transition-colors flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Launch with {selectedRole.name} ({selectedRole.role.replace('_', ' ')})</span>
          </button>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <a
              href="#signup"
              onClick={(e) => {
                e.preventDefault();
                onLogin(selectedRole);
              }}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Register Officer ID
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
