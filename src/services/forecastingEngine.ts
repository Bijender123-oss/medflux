import { Facility, MedicineInventory, RiskLevel, ExpiryStatus, SimulationParams, AlertItem } from '../types';

export function calculateMedicineForecast(
  medicine: MedicineInventory,
  facility: Facility,
  simulation?: SimulationParams
): MedicineInventory {
  // 1. Baseline demand from 30-day history
  const history = medicine.historicalConsumption;
  const historyAvg = history.length > 0
    ? history.reduce((sum, v) => sum + v, 0) / history.length
    : medicine.dailyConsumption;

  // 2. Trend factor (last 7 days vs 30-day average)
  const last7Days = history.slice(-7);
  const last7Avg = last7Days.length > 0
    ? last7Days.reduce((sum, v) => sum + v, 0) / last7Days.length
    : historyAvg;
  const trendFactor = historyAvg > 0 ? Number((last7Avg / historyAvg).toFixed(2)) : 1.0;

  // 3. Patient footfall factor
  const footfallFactor = facility.patients7DayAverage > 0
    ? Number((facility.patientsToday / facility.patients7DayAverage).toFixed(2))
    : 1.0;

  // 4. Seasonal multiplier
  let seasonalMultiplier = 1.0;
  if (medicine.name.includes('ORS') || medicine.name.includes('IV Fluids')) {
    seasonalMultiplier = 1.25; // Seasonal diarrheal/monsoon vector baseline
  } else if (medicine.name.includes('Paracetamol') || medicine.name.includes('Antimalarial')) {
    seasonalMultiplier = 1.15; // Vector borne seasonal baseline
  }

  // 5. Emergency multiplier from simulation
  let emergencyMultiplier = 1.0;
  if (simulation) {
    const medIncrease = simulation.medicineDemandIncreasePct / 100;
    const patIncrease = simulation.patientDemandIncreasePct / 100;

    // Specific disease surge targeting
    if (simulation.affectedDiseases.includes('Dengue') && 
       (medicine.name.includes('ORS') || medicine.name.includes('IV Fluids') || medicine.name.includes('Paracetamol'))) {
      emergencyMultiplier = 1.0 + (medIncrease * 1.2) + (patIncrease * 0.8);
    } else {
      emergencyMultiplier = 1.0 + (medIncrease * 0.7) + (patIncrease * 0.5);
    }
  }

  // Final predicted daily demand
  const effectiveLeadDays = medicine.supplierLeadDays + (simulation?.supplierDelayDays || 0);
  const combinedMultiplier = trendFactor * footfallFactor * seasonalMultiplier * emergencyMultiplier;
  const predictedDailyDemand = Math.max(1, Math.round(historyAvg * combinedMultiplier));

  // Days to stock-out
  const daysUntilStockout = Number((medicine.stockQuantity / predictedDailyDemand).toFixed(1));

  // Safety stock: lead time demand + 3 days buffer
  const safetyStock = Math.round(predictedDailyDemand * (effectiveLeadDays + 3));

  // Determine Risk Category
  let riskLevel: RiskLevel = 'GREEN';
  if (daysUntilStockout <= 4 || medicine.stockQuantity < (safetyStock * 0.5)) {
    riskLevel = 'RED';
  } else if (daysUntilStockout <= 7 || medicine.stockQuantity < safetyStock) {
    riskLevel = 'ORANGE';
  } else if (daysUntilStockout <= 14) {
    riskLevel = 'YELLOW';
  } else {
    riskLevel = 'GREEN';
  }

  // Expiry Intelligence calculation
  const now = new Date('2026-09-30T09:58:31-07:00'); // current simulated time
  const expDate = new Date(medicine.expiryDate);
  const diffTime = expDate.getTime() - now.getTime();
  const daysUntilExpiry = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const daysToConsumeEntireStock = Math.ceil(medicine.stockQuantity / predictedDailyDemand);

  let expiryRisk: ExpiryStatus = 'SAFE';
  if (daysUntilExpiry <= daysToConsumeEntireStock) {
    // Risk of expiring before consumption!
    if (daysUntilExpiry <= 60) {
      expiryRisk = 'URGENT';
    } else if (daysUntilExpiry <= 150) {
      expiryRisk = 'AT_RISK';
    } else {
      expiryRisk = 'WATCH';
    }
  } else {
    if (daysUntilExpiry <= 90) {
      expiryRisk = 'WATCH';
    } else {
      expiryRisk = 'SAFE';
    }
  }

  return {
    ...medicine,
    predictedDailyDemand,
    daysUntilStockout,
    safetyStock,
    riskLevel,
    daysUntilExpiry,
    expiryRisk,
    demandTrendFactor: trendFactor,
    seasonalMultiplier,
    emergencyMultiplier: Number(emergencyMultiplier.toFixed(2))
  };
}

export function evaluateFacility(facility: Facility, simulation?: SimulationParams): Facility {
  let simPatientsToday = facility.patientsToday;
  let simBedsOccupied = facility.bedsOccupied;
  let simStaffAvailable = facility.staffAvailable;

  if (simulation) {
    const pMultiplier = 1 + (simulation.patientDemandIncreasePct / 100);
    simPatientsToday = Math.round(facility.patientsToday * pMultiplier);

    const bedAdjust = (simulation.bedCapacityAdjustmentPct / 100);
    const extraBedsNeeded = Math.round(facility.bedsOccupied * (pMultiplier - 1) * 0.7);
    simBedsOccupied = Math.min(facility.bedsTotal, Math.round((facility.bedsOccupied + extraBedsNeeded) * (1 - bedAdjust)));

    const staffPct = simulation.staffAvailabilityPct / 100;
    simStaffAvailable = Math.max(1, Math.round(facility.staffRequired * staffPct));
  }

  // Recalculate all medicines
  const updatedMedicines = facility.medicines.map(m => calculateMedicineForecast(m, facility, simulation));

  // Determine overall facility risk level
  const criticalCount = updatedMedicines.filter(m => m.riskLevel === 'RED').length;
  const orangeCount = updatedMedicines.filter(m => m.riskLevel === 'ORANGE').length;
  const bedOccupancyRate = facility.bedsTotal > 0 ? Math.round((simBedsOccupied / facility.bedsTotal) * 100) : 0;
  const staffShortage = Math.max(0, facility.staffRequired - simStaffAvailable);

  let overallRiskLevel: RiskLevel = 'GREEN';
  if (criticalCount >= 1 || bedOccupancyRate >= 92 || staffShortage >= 4) {
    overallRiskLevel = 'RED';
  } else if (orangeCount >= 2 || bedOccupancyRate >= 85 || staffShortage >= 2) {
    overallRiskLevel = 'ORANGE';
  } else if (orangeCount >= 1 || bedOccupancyRate >= 75) {
    overallRiskLevel = 'YELLOW';
  }

  return {
    ...facility,
    patientsToday: simPatientsToday,
    bedsOccupied: simBedsOccupied,
    staffAvailable: simStaffAvailable,
    medicines: updatedMedicines,
    overallRiskLevel,
    criticalMedicinesCount: criticalCount,
    bedOccupancyRate,
    staffShortage
  };
}

export function generateAlerts(facilities: Facility[]): AlertItem[] {
  const alerts: AlertItem[] = [];

  facilities.forEach(fac => {
    // 1. Medicine Alerts
    fac.medicines.forEach(m => {
      if (m.riskLevel === 'RED') {
        alerts.push({
          id: `ALT-MED-${fac.id}-${m.medicineId}`,
          facilityId: fac.id,
          facilityName: fac.name,
          district: fac.district,
          state: fac.state,
          severity: 'RED',
          title: `CRITICAL: ${m.name} stock-out predicted in ${m.daysUntilStockout} days`,
          why: `Current stock (${m.stockQuantity.toLocaleString()} ${m.unit}) cannot sustain surge consumption rate of ${m.predictedDailyDemand} ${m.unit}/day under supplier lead time of ${m.supplierLeadDays} days.`,
          whenPredicted: `${m.daysUntilStockout} days remaining`,
          impact: `Emergency hydration and inpatient care disrupted; potential referral overflow to district hospital.`,
          recommendedAction: `Initiate immediate inter-district redistribution from nearby surplus CHC or trigger emergency depot dispatch.`,
          metricType: 'MEDICINE',
          timestamp: 'Just now'
        });
      } else if (m.riskLevel === 'ORANGE') {
        alerts.push({
          id: `ALT-MED-${fac.id}-${m.medicineId}`,
          facilityId: fac.id,
          facilityName: fac.name,
          district: fac.district,
          state: fac.state,
          severity: 'ORANGE',
          title: `HIGH ALERT: ${m.name} approaching safety threshold`,
          why: `Stock coverage down to ${m.daysUntilStockout} days. Consumption velocity accelerated by factor ${m.emergencyMultiplier}x.`,
          whenPredicted: `${m.daysUntilStockout} days remaining`,
          impact: `Buffer stock depletion imminent before next replenishment cycle.`,
          recommendedAction: `Review pending supply orders and reserve buffer.`,
          metricType: 'MEDICINE',
          timestamp: '10 mins ago'
        });
      }

      // Expiry Alert
      if (m.expiryRisk === 'URGENT' || m.expiryRisk === 'AT_RISK') {
        const pDemand = m.predictedDailyDemand || m.dailyConsumption;
        const dExpiry = m.daysUntilExpiry || 30;
        const unitsExpected = Math.round(pDemand * dExpiry);
        alerts.push({
          id: `ALT-EXP-${fac.id}-${m.medicineId}`,
          facilityId: fac.id,
          facilityName: fac.name,
          district: fac.district,
          state: fac.state,
          severity: m.expiryRisk === 'URGENT' ? 'ORANGE' : 'YELLOW',
          title: `EXPIRY RISK: Batch ${m.batchNumber} (${m.name})`,
          why: `Expires on ${m.expiryDate} (${dExpiry} days left), but local demand will only consume ~${unitsExpected} units before expiry.`,
          whenPredicted: `${dExpiry} days to expiry`,
          impact: `Risk of stock wastage worth critical public health inventory.`,
          recommendedAction: `Redistribute ~${Math.max(100, m.stockQuantity - unitsExpected)} units to higher-throughput District Hospital immediately.`,
          metricType: 'EXPIRY',
          timestamp: '1 hour ago'
        });
      }
    });

    // 2. Bed Occupancy Alerts
    if (fac.bedOccupancyRate >= 90) {
      alerts.push({
        id: `ALT-BED-${fac.id}`,
        facilityId: fac.id,
        facilityName: fac.name,
        district: fac.district,
        state: fac.state,
        severity: 'RED',
        title: `CRITICAL BED OVERCROWDING: ${fac.bedOccupancyRate}% Occupancy`,
        why: `${fac.bedsOccupied} of ${fac.bedsTotal} beds in use under surge footfall.`,
        whenPredicted: `Immediate capacity ceiling reached`,
        impact: `Inpatient rejection or floor bed setup required.`,
        recommendedAction: `Route incoming non-critical cases to nearest CHC or activate auxiliary beds.`,
        metricType: 'BEDS',
        timestamp: 'Just now'
      });
    }

    // 3. Data Reliability Alert
    if (fac.dataReliabilityScore < 88) {
      alerts.push({
        id: `ALT-DATA-${fac.id}`,
        facilityId: fac.id,
        facilityName: fac.name,
        district: fac.district,
        state: fac.state,
        severity: 'YELLOW',
        title: `DATA WARNING: ${fac.name} reliability score at ${fac.dataReliabilityScore}%`,
        why: fac.dataReliabilityIssues.join(', ') || 'Stale inventory telemetry reported',
        whenPredicted: 'Verification required',
        impact: `Forecast confidence interval widened.`,
        recommendedAction: `Send SMS audit prompt to facility pharmacist to re-verify physical inventory count.`,
        metricType: 'DATA_QUALITY',
        timestamp: '2 hours ago'
      });
    }
  });

  return alerts;
}
