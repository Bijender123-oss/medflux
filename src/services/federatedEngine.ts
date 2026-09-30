import { FederatedLearningStatus, FederatedStateNode } from '../types';

export function runFederatedRound(currentStatus: FederatedLearningStatus): FederatedLearningStatus {
  const nextRound = currentStatus.roundNumber + 1;

  // 1. Simulate local edge training per state node
  const updatedNodes: FederatedStateNode[] = currentStatus.stateNodes.map((node) => {
    // Add small random convergence gradient
    const noise = () => (Math.random() - 0.5) * 0.015;
    const lossDecay = 0.94 + (Math.random() * 0.04);
    const newLoss = Math.max(0.018, Number((node.localLoss * lossDecay).toFixed(4)));

    const newElasticity = Number((node.parameters.demandElasticity + noise()).toFixed(3));
    const newDrift = Number((node.parameters.seasonalDrift + noise()).toFixed(3));
    const newLeadTime = Number((node.parameters.leadTimeSensitivity + noise()).toFixed(3));
    const newOutbreak = Number((node.parameters.outbreakCoefficient + noise()).toFixed(3));

    return {
      ...node,
      localModelVersion: `v2.${Math.floor(nextRound / 10)}.${nextRound % 10}-${node.stateName.slice(0, 2).toUpperCase()}`,
      localLoss: newLoss,
      recordsProcessed: node.recordsProcessed + Math.floor(Math.random() * 450 + 200),
      lastTrainingTime: 'Just now (Round ' + nextRound + ')',
      parameters: {
        demandElasticity: newElasticity,
        seasonalDrift: newDrift,
        leadTimeSensitivity: newLeadTime,
        outbreakCoefficient: newOutbreak
      }
    };
  });

  // 2. FedAvg Aggregation on Server
  let totalSampleWeight = 0;
  let aggElasticity = 0;
  let aggDrift = 0;
  let aggLeadTime = 0;
  let aggOutbreak = 0;
  let totalLoss = 0;

  updatedNodes.forEach(node => {
    totalSampleWeight += node.sampleWeight;
    aggElasticity += node.parameters.demandElasticity * node.sampleWeight;
    aggDrift += node.parameters.seasonalDrift * node.sampleWeight;
    aggLeadTime += node.parameters.leadTimeSensitivity * node.sampleWeight;
    aggOutbreak += node.parameters.outbreakCoefficient * node.sampleWeight;
    totalLoss += node.localLoss * node.sampleWeight;
  });

  const globalElasticity = Number((aggElasticity / totalSampleWeight).toFixed(3));
  const globalDrift = Number((aggDrift / totalSampleWeight).toFixed(3));
  const globalLeadTime = Number((aggLeadTime / totalSampleWeight).toFixed(3));
  const globalOutbreak = Number((aggOutbreak / totalSampleWeight).toFixed(3));
  const newGlobalLoss = Number((totalLoss / totalSampleWeight).toFixed(4));

  const newConvergenceHistory = [
    ...currentStatus.convergenceLossHistory,
    {
      round: nextRound,
      globalLoss: newGlobalLoss,
      avgLocalLoss: Number((totalLoss / updatedNodes.length).toFixed(4))
    }
  ].slice(-10); // Keep last 10 rounds

  return {
    ...currentStatus,
    globalModelVersion: `v2.${Math.floor(nextRound / 10)}.${nextRound % 10}-global-fedavg`,
    roundNumber: nextRound,
    lastAggregatedAt: 'Just now (' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST)',
    globalLoss: newGlobalLoss,
    convergenceLossHistory: newConvergenceHistory,
    globalParameters: {
      demandElasticity: globalElasticity,
      seasonalDrift: globalDrift,
      leadTimeSensitivity: globalLeadTime,
      outbreakCoefficient: globalOutbreak
    },
    stateNodes: updatedNodes
  };
}
