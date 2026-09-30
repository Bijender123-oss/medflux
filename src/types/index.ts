export type FacilityType = 'PHC' | 'CHC' | 'DISTRICT_HOSPITAL' | 'STATE_DEPOT';

export type RiskLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export type ExpiryStatus = 'SAFE' | 'WATCH' | 'AT_RISK' | 'URGENT';

export interface MedicineInventory {
  medicineId: string;
  name: string;
  category: string;
  stockQuantity: number;
  dailyConsumption: number; // calculated baseline
  historicalConsumption: number[]; // 30-day historical points
  expiryDate: string; // ISO date format
  batchNumber: string;
  pendingQuantity: number;
  supplierLeadDays: number;
  unit: string;
  // Computed values
  predictedDailyDemand?: number;
  daysUntilStockout?: number;
  safetyStock?: number;
  riskLevel?: RiskLevel;
  daysUntilExpiry?: number;
  expiryRisk?: ExpiryStatus;
  demandTrendFactor?: number;
  seasonalMultiplier?: number;
  emergencyMultiplier?: number;
}

export interface Facility {
  id: string;
  name: string;
  state: string;
  district: string;
  facilityType: FacilityType;
  coordinates: {
    lat: number;
    lng: number;
  };
  bedsTotal: number;
  bedsOccupied: number;
  staffRequired: number;
  staffAvailable: number;
  patientsToday: number;
  patients7DayAverage: number;
  dataReliabilityScore: number; // 0 - 100
  dataReliabilityIssues: string[];
  lastUpdated: string;
  medicines: MedicineInventory[];
  // Aggregated status
  overallRiskLevel: RiskLevel;
  criticalMedicinesCount: number;
  bedOccupancyRate: number;
  staffShortage: number;
}

export interface SimulationParams {
  scenarioName: string;
  patientDemandIncreasePct: number; // 0 - 100
  medicineDemandIncreasePct: number; // 0 - 100
  supplierDelayDays: number; // 0 - 30
  staffAvailabilityPct: number; // 50 - 100
  bedCapacityAdjustmentPct: number; // -30 to +50
  affectedDiseases: string[];
  notes?: string;
}

export interface TransferOrder {
  id: string;
  sourceFacilityId: string;
  sourceFacilityName: string;
  sourceDistrict: string;
  sourceState: string;
  destinationFacilityId: string;
  destinationFacilityName: string;
  destinationDistrict: string;
  destinationState: string;
  medicineName: string;
  medicineId: string;
  quantity: number;
  unit: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'REJECTED';
  distanceKm: number;
  estimatedTransportHours: number;
  approvedBy?: string;
  approvedRole?: string;
  approvalTimestamp?: string;
  coverageExtensionDays: number;
  donorRemainingDaysCoverage: number;
  aiRationale?: string;
  batchNumber: string;
  createdAt: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  userRole: string;
  userName: string;
  action: 'TRANSFER_APPROVED' | 'TRANSFER_MODIFIED' | 'TRANSFER_REJECTED' | 'SIMULATION_TRIGGERED' | 'SCENARIO_RESET' | 'FEDERATED_ROUND_EXECUTED';
  resourceType: string;
  source: string;
  destination: string;
  quantity: number;
  reason: string;
  status: string;
  hash: string;
}

export interface AlertItem {
  id: string;
  facilityId: string;
  facilityName: string;
  district: string;
  state: string;
  severity: RiskLevel;
  title: string;
  why: string;
  whenPredicted: string;
  impact: string;
  recommendedAction: string;
  metricType: 'MEDICINE' | 'BEDS' | 'STAFF' | 'EXPIRY' | 'DATA_QUALITY';
  timestamp: string;
}

export interface FederatedStateNode {
  stateName: string;
  facilityCount: number;
  recordsProcessed: number;
  localModelVersion: string;
  localLoss: number;
  sampleWeight: number; // 0 to 1
  parameters: {
    demandElasticity: number;
    seasonalDrift: number;
    leadTimeSensitivity: number;
    outbreakCoefficient: number;
  };
  lastTrainingTime: string;
  contributionPct: number;
}

export interface FederatedLearningStatus {
  globalModelVersion: string;
  roundNumber: number;
  totalParticipatingStates: number;
  totalFacilitiesCovered: number;
  lastAggregatedAt: string;
  globalLoss: number;
  convergenceLossHistory: { round: number; globalLoss: number; avgLocalLoss: number }[];
  globalParameters: {
    demandElasticity: number;
    seasonalDrift: number;
    leadTimeSensitivity: number;
    outbreakCoefficient: number;
  };
  stateNodes: FederatedStateNode[];
}

export interface OptimizationCandidate {
  facilityId: string;
  facilityName: string;
  district: string;
  state: string;
  currentStock: number;
  safetyStock: number;
  surplusAvailable: number;
  distanceKm: number;
  estimatedTransitHours: number;
  batchExpiryDate: string;
  daysToExpiry: number;
  compositeScore: number; // 0 to 100 (higher is better)
  feasibilityRank: number;
  pros: string[];
  cons: string[];
  recommendedQuantity: number;
}

export interface OptimizationResult {
  targetFacilityId: string;
  targetFacilityName: string;
  targetDistrict: string;
  targetState: string;
  medicineName: string;
  shortageQuantity: number;
  currentDaysCoverage: number;
  candidates: OptimizationCandidate[];
  recommendedCandidate: OptimizationCandidate | null;
  expectedPostTransferCoverageDays: number;
  geminiAnalysis?: GeminiRecommendationResponse;
}

export interface GeminiRecommendationResponse {
  riskSummary: string;
  keyReasons: string[];
  recommendedAction: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  expectedImpact: string;
  caveats: string[];
}

export interface UserRoleProfile {
  id: string;
  name: string;
  role: 'PHC_OFFICER' | 'DISTRICT_OFFICER' | 'STATE_ADMIN' | 'NATIONAL_ADMIN';
  designation: string;
  assignedFacilityId?: string;
  assignedDistrict?: string;
  assignedState?: string;
}

export type SupportedLanguage = 'en' | 'hi';
