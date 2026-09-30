import { Facility, MedicineInventory, OptimizationCandidate, OptimizationResult } from '../types';
import { getDistance } from '../data/seedData';

export function runRedistributionOptimizer(
  targetFacilityId: string,
  medicineId: string,
  allFacilities: Facility[],
  requestedUnits?: number
): OptimizationResult {
  const target = allFacilities.find(f => f.id === targetFacilityId);
  if (!target) {
    throw new Error(`Target facility ${targetFacilityId} not found`);
  }

  const targetMed = target.medicines.find(m => m.medicineId === medicineId);
  if (!targetMed) {
    throw new Error(`Medicine ${medicineId} not found in target facility`);
  }

  const targetDailyDemand = targetMed.predictedDailyDemand || targetMed.dailyConsumption;
  const targetCoverage = targetMed.daysUntilStockout || (targetMed.stockQuantity / targetDailyDemand);

  // Recommended quantity needed to bring target up to ~14-16 days of safety stock
  const targetDeficitTo14Days = Math.max(200, Math.round((14 - targetCoverage) * targetDailyDemand));
  const transferQuantity = requestedUnits || Math.min(2500, targetDeficitTo14Days);

  const candidates: OptimizationCandidate[] = [];

  for (const fac of allFacilities) {
    if (fac.id === targetFacilityId) continue;

    const med = fac.medicines.find(m => m.medicineId === medicineId);
    if (!med) continue;

    const donorDaily = med.predictedDailyDemand || med.dailyConsumption;
    const donorSafetyStock = med.safetyStock || (donorDaily * (med.supplierLeadDays + 3));
    const surplusAvailable = Math.max(0, med.stockQuantity - donorSafetyStock);

    // Feasibility check: donor must have at least 150 units of surplus above safety stock
    if (surplusAvailable < 150) {
      continue;
    }

    const distanceKm = getDistance(fac.district, target.district);
    const estimatedTransitHours = Number((Math.max(1, distanceKm / 45) + 0.5).toFixed(1)); // 45km/h avg + handling
    const daysToExpiry = med.daysUntilExpiry || 365;

    // Rationale Pros & Cons
    const pros: string[] = [];
    const cons: string[] = [];

    if (fac.district === target.district) {
      pros.push('Intra-district dispatch (rapid turnaround <2 hrs)');
    } else if (distanceKm <= 120) {
      pros.push(`Short transit distance (${distanceKm} km, ~${estimatedTransitHours} hrs)`);
    } else {
      cons.push(`Inter-district haul (${distanceKm} km, ~${estimatedTransitHours} hrs transport)`);
    }

    if (surplusAvailable >= transferQuantity * 1.5) {
      pros.push(`High surplus margin (${surplusAvailable.toLocaleString()} ${med.unit} available above safety reserve)`);
    } else {
      cons.push(`Limited surplus buffer (${surplusAvailable.toLocaleString()} ${med.unit})`);
    }

    if (daysToExpiry < 200) {
      pros.push(`Prioritizes batch with closer expiry (${daysToExpiry} days left), preventing wastage`);
    }

    if (fac.dataReliabilityScore < 90) {
      cons.push(`Donor telemetry reliability is ${fac.dataReliabilityScore}%`);
    } else {
      pros.push(`High donor telemetry reliability (${fac.dataReliabilityScore}%)`);
    }

    // Scoring Algorithm (0 to 100)
    // 40% surplus availability
    const surplusScore = Math.min(100, (surplusAvailable / (transferQuantity * 2)) * 100);
    // 35% proximity (shorter is better)
    const proximityScore = Math.max(10, 100 - (distanceKm / 8));
    // 15% expiry utility (batches expiring within 180-360 days receive preference for timely usage)
    const expiryScore = daysToExpiry < 90 ? 40 : (daysToExpiry < 300 ? 95 : 80);
    // 10% data reliability
    const reliabilityScore = fac.dataReliabilityScore;

    const compositeScore = Math.round(
      (surplusScore * 0.40) +
      (proximityScore * 0.35) +
      (expiryScore * 0.15) +
      (reliabilityScore * 0.10)
    );

    const allocQuantity = Math.min(transferQuantity, surplusAvailable);

    candidates.push({
      facilityId: fac.id,
      facilityName: fac.name,
      district: fac.district,
      state: fac.state,
      currentStock: med.stockQuantity,
      safetyStock: donorSafetyStock,
      surplusAvailable,
      distanceKm,
      estimatedTransitHours,
      batchExpiryDate: med.expiryDate,
      daysToExpiry,
      compositeScore,
      feasibilityRank: 1, // to be sorted
      pros,
      cons,
      recommendedQuantity: allocQuantity
    });
  }

  // Sort descending by compositeScore
  candidates.sort((a, b) => b.compositeScore - a.compositeScore);
  candidates.forEach((c, idx) => {
    c.feasibilityRank = idx + 1;
  });

  const recommendedCandidate = candidates.length > 0 ? candidates[0] : null;
  const transferUnits = recommendedCandidate ? recommendedCandidate.recommendedQuantity : 0;
  const postStock = targetMed.stockQuantity + transferUnits;
  const expectedPostTransferCoverageDays = Number((postStock / targetDailyDemand).toFixed(1));

  return {
    targetFacilityId,
    targetFacilityName: target.name,
    targetDistrict: target.district,
    targetState: target.state,
    medicineName: targetMed.name,
    shortageQuantity: transferQuantity,
    currentDaysCoverage: Number(targetCoverage.toFixed(1)),
    candidates: candidates.slice(0, 5), // top 5 candidate sources
    recommendedCandidate,
    expectedPostTransferCoverageDays
  };
}
