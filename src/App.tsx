import React, { useState, useEffect } from 'react';
import {
  Activity,
  Sparkles
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { DemoController } from './components/DemoController';
import { NationalOverview } from './components/NationalOverview';
import { EmergencySimulator } from './components/EmergencySimulator';
import { RedistributionOptimizer } from './components/RedistributionOptimizer';
import { DigitalTwin } from './components/DigitalTwin';
import { FederatedAiView } from './components/FederatedAiView';
import { ExpiryIntelligence } from './components/ExpiryIntelligence';
import { DataReliabilityView } from './components/DataReliabilityView';
import { AuditTrailView } from './components/AuditTrailView';
import { GeminiCopilotModal } from './components/GeminiCopilotModal';
import { LoginPage } from './components/LoginPage';

import {
  Facility,
  AlertItem,
  SimulationParams,
  FederatedLearningStatus,
  TransferOrder,
  AuditRecord,
  UserRoleProfile,
  SupportedLanguage
} from './types';
import { t } from './utils/translations';
import { USER_ROLES } from './components/Navbar';
import { INITIAL_FEDERATED_STATUS } from './data/seedData';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeSimulation, setActiveSimulation] = useState<SimulationParams | null>(null);
  const [federatedStatus, setFederatedStatus] = useState<FederatedLearningStatus>(INITIAL_FEDERATED_STATUS);
  const [transferOrders, setTransferOrders] = useState<TransferOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [currentRole, setCurrentRole] = useState<UserRoleProfile>(USER_ROLES[1]); // Default to Dr. Sunita Verma
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  const [selectedState, setSelectedState] = useState<string>('Uttar Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Lucknow');
  const [targetOptimizerFacility, setTargetOptimizerFacility] = useState<string>('FAC-UP-LKO-01');
  const [targetOptimizerMedicine, setTargetOptimizerMedicine] = useState<string>('MED-ORS');

  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotInitialPrompt, setCopilotInitialPrompt] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live state from backend
  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        setFacilities(data.facilities || []);
        setAlerts(data.alerts || []);
        setActiveSimulation(data.activeSimulation || null);
        if (data.federatedStatus) setFederatedStatus(data.federatedStatus);
        setTransferOrders(data.transferOrders || []);
        setAuditLogs(data.auditLogs || []);
        setHasGeminiKey(Boolean(data.hasGeminiKey));
      }
    } catch (err) {
      console.error('Failed to load live data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Trigger Simulation
  const handleSimulate = async (params: SimulationParams) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          userRole: currentRole.role.replace('_', ' '),
          userName: currentRole.name
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFacilities(data.facilities);
        setAlerts(data.alerts);
        setActiveSimulation(data.activeSimulation);
        setAuditLogs(data.auditLogs);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Scenario
  const handleReset = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setFacilities(data.facilities);
        setAlerts(data.alerts);
        setActiveSimulation(null);
        setTransferOrders(data.transferOrders);
        setAuditLogs(data.auditLogs);
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Approve Transfer
  const handleApproveTransfer = async (transferData: any) => {
    const res = await fetch('/api/transfers/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...transferData,
        approvedBy: currentRole.name,
        approvedRole: currentRole.role.replace('_', ' ')
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Approval failed');
    }
    const data = await res.json();
    setFacilities(data.facilities);
    setAlerts(data.alerts);
    setTransferOrders(prev => [data.transferOrder, ...prev]);
    setAuditLogs(data.auditLogs);
  };

  // Run Federated Learning Round
  const handleRunFederatedRound = async () => {
    const res = await fetch('/api/federated/run-round', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setFederatedStatus(data.federatedStatus);
      setAuditLogs(data.auditLogs);
    }
  };

  const navigateToOptimizer = (targetFacId: string, medId: string) => {
    setTargetOptimizerFacility(targetFacId);
    setTargetOptimizerMedicine(medId);
    setActiveTab('optimizer');
  };

  const openCopilotWithPrompt = (prompt?: string) => {
    setCopilotInitialPrompt(prompt || '');
    setIsCopilotOpen(true);
  };

  const tabTitles: Record<string, string> = {
    overview: t('nationalOverview', language),
    simulator: t('emergencySimulator', language),
    optimizer: t('redistributionOptimizer', language),
    digital_twin: t('digitalTwin', language),
    federated: t('federatedAi', language),
    expiry: t('expiryIntelligence', language),
    reliability: t('dataReliability', language),
    audit: t('auditTrail', language)
  };

  // Render Login page if signed out
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={(role) => {
          setCurrentRole(role);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentRole={currentRole}
        onLogout={() => setIsAuthenticated(false)}
        language={language}
        criticalAlertCount={alerts.filter(a => a.severity === 'RED').length}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <TopNavbar
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          language={language}
          onLanguageChange={setLanguage}
          hasGeminiKey={hasGeminiKey}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          activeSimulation={activeSimulation}
          onResetSimulation={handleReset}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          activeTabTitle={tabTitles[activeTab] || 'Dashboard'}
        />

        {/* Demo Controller Toolbar */}
        <DemoController
          activeSimulation={activeSimulation}
          onSimulate={handleSimulate}
          onReset={handleReset}
          language={language}
          isLoading={isLoading}
        />

        {/* Content Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isLoading && facilities.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Activity className="h-8 w-8 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-slate-500">Loading MediFlux AI healthcare network...</span>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <NationalOverview
                  facilities={facilities}
                  alerts={alerts}
                  language={language}
                  onSelectFacility={(facId) => {
                    setTargetOptimizerFacility(facId);
                    setActiveTab('digital_twin');
                  }}
                  onNavigateToOptimizer={navigateToOptimizer}
                  onOpenCopilot={openCopilotWithPrompt}
                  selectedState={selectedState}
                  onSelectState={setSelectedState}
                  selectedDistrict={selectedDistrict}
                  onSelectDistrict={setSelectedDistrict}
                />
              )}

              {activeTab === 'simulator' && (
                <EmergencySimulator
                  facilities={facilities}
                  activeSimulation={activeSimulation}
                  onApplySimulation={handleSimulate}
                  onResetSimulation={handleReset}
                  language={language}
                />
              )}

              {activeTab === 'optimizer' && (
                <RedistributionOptimizer
                  facilities={facilities}
                  initialTargetFacilityId={targetOptimizerFacility}
                  initialMedicineId={targetOptimizerMedicine}
                  onApproveTransfer={handleApproveTransfer}
                  onNavigateToAudit={() => setActiveTab('audit')}
                  language={language}
                  currentRole={currentRole}
                />
              )}

              {activeTab === 'digital_twin' && (
                <DigitalTwin
                  facilities={facilities}
                  language={language}
                  onSelectFacility={(facId) => setTargetOptimizerFacility(facId)}
                  onNavigateToOptimizer={navigateToOptimizer}
                />
              )}

              {activeTab === 'federated' && (
                <FederatedAiView
                  federatedStatus={federatedStatus}
                  onRunFederatedRound={handleRunFederatedRound}
                  language={language}
                />
              )}

              {activeTab === 'expiry' && (
                <ExpiryIntelligence
                  facilities={facilities}
                  language={language}
                  onNavigateToOptimizer={navigateToOptimizer}
                />
              )}

              {activeTab === 'reliability' && (
                <DataReliabilityView
                  facilities={facilities}
                  language={language}
                />
              )}

              {activeTab === 'audit' && (
                <AuditTrailView
                  auditLogs={auditLogs}
                  transferOrders={transferOrders}
                  language={language}
                />
              )}
            </>
          )}
        </main>

        {/* Clean Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-semibold text-slate-700">
              MediFlux AI • Federated Healthcare Resource Intelligence
            </span>
            <span className="text-slate-400">
              Powered by Google Gemini 3.8 Flash • Government of India Public Health System Prototype
            </span>
          </div>
        </footer>
      </div>

      {/* Floating Gemini AI Copilot Trigger */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsCopilotOpen(true)}
          className="flex items-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/30 border border-blue-500 font-bold text-xs transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="h-4 w-4 text-blue-200" />
          <span>{t('copilot', language)}</span>
        </button>
      </div>

      {/* Gemini AI Copilot Modal */}
      <GeminiCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        language={language}
        initialPrompt={copilotInitialPrompt}
      />
    </div>
  );
}
