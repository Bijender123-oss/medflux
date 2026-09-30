import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  createInitialFacilities,
  INITIAL_FEDERATED_STATUS,
  INITIAL_AUDIT_LOGS,
  INITIAL_TRANSFERS
} from './src/data/seedData';
import { evaluateFacility, generateAlerts } from './src/services/forecastingEngine';
import { runRedistributionOptimizer } from './src/services/redistributionOptimizer';
import { runFederatedRound } from './src/services/federatedEngine';
import {
  Facility,
  SimulationParams,
  TransferOrder,
  AuditRecord,
  FederatedLearningStatus,
  AlertItem
} from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Server State
let facilities: Facility[] = createInitialFacilities().map(f => evaluateFacility(f));
let alerts: AlertItem[] = generateAlerts(facilities);
let activeSimulation: SimulationParams | null = null;
let federatedStatus: FederatedLearningStatus = { ...INITIAL_FEDERATED_STATUS };
let transferOrders: TransferOrder[] = [...INITIAL_TRANSFERS];
let auditLogs: AuditRecord[] = [...INITIAL_AUDIT_LOGS];

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || '';
const hasGeminiKey = Boolean(apiKey && apiKey.length > 5);
const ai = hasGeminiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    })
  : null;

// Helper to recalculate all facilities & alerts
function refreshState() {
  facilities = facilities.map(f => evaluateFacility(f, activeSimulation || undefined));
  alerts = generateAlerts(facilities);
}

// -------------------------------------------------------------
// Core Data APIs
// -------------------------------------------------------------

app.get('/api/data', (_req, res) => {
  res.json({
    facilities,
    alerts,
    activeSimulation,
    federatedStatus,
    transferOrders,
    auditLogs,
    hasGeminiKey
  });
});

app.post('/api/simulate', (req, res) => {
  const params: SimulationParams = req.body;
  activeSimulation = params;
  refreshState();

  // Add audit record
  const auditEntry: AuditRecord = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    userRole: req.body.userRole || 'District Health Officer',
    userName: req.body.userName || 'Dr. Sunita Verma',
    action: 'SIMULATION_TRIGGERED',
    resourceType: 'Emergency Parameter Set',
    source: 'Simulator Engine',
    destination: 'Statewide Health Network',
    quantity: params.patientDemandIncreasePct,
    reason: `Scenario: ${params.scenarioName} (+${params.patientDemandIncreasePct}% Patients, +${params.medicineDemandIncreasePct}% Meds)`,
    status: 'ACTIVE_SIMULATION',
    hash: Math.random().toString(36).substring(2, 10)
  };
  auditLogs.unshift(auditEntry);

  res.json({
    success: true,
    activeSimulation,
    facilities,
    alerts,
    auditLogs
  });
});

app.post('/api/reset', (_req, res) => {
  activeSimulation = null;
  facilities = createInitialFacilities().map(f => evaluateFacility(f));
  alerts = generateAlerts(facilities);
  transferOrders = [...INITIAL_TRANSFERS];

  const auditEntry: AuditRecord = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    userRole: 'National Administrator',
    userName: 'Dr. K. Swaminathan',
    action: 'SCENARIO_RESET',
    resourceType: 'Baseline State',
    source: 'System Controller',
    destination: 'All Monitored Facilities',
    quantity: 0,
    reason: 'Reset scenario to pristine seeded state',
    status: 'RESTORED',
    hash: Math.random().toString(36).substring(2, 10)
  };
  auditLogs.unshift(auditEntry);

  res.json({
    success: true,
    facilities,
    alerts,
    activeSimulation,
    transferOrders,
    auditLogs
  });
});

app.post('/api/optimize-redistribution', (req, res) => {
  const { targetFacilityId, medicineId, requestedUnits } = req.body;
  try {
    const result = runRedistributionOptimizer(
      targetFacilityId,
      medicineId,
      facilities,
      requestedUnits ? Number(requestedUnits) : undefined
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Optimization failed' });
  }
});

app.post('/api/transfers/approve', (req, res) => {
  const {
    sourceFacilityId,
    destinationFacilityId,
    medicineId,
    quantity,
    approvedBy,
    approvedRole,
    coverageExtensionDays,
    aiRationale
  } = req.body;

  const sourceFac = facilities.find(f => f.id === sourceFacilityId);
  const destFac = facilities.find(f => f.id === destinationFacilityId);

  if (!sourceFac || !destFac) {
    return res.status(404).json({ error: 'Source or destination facility not found' });
  }

  const sourceMed = sourceFac.medicines.find(m => m.medicineId === medicineId);
  const destMed = destFac.medicines.find(m => m.medicineId === medicineId);

  if (!sourceMed || !destMed) {
    return res.status(404).json({ error: 'Medicine not found in facility' });
  }

  const transferQty = Number(quantity);
  if (sourceMed.stockQuantity < transferQty) {
    return res.status(400).json({ error: 'Insufficient stock in source facility' });
  }

  // 1. Mutate physical inventories
  sourceMed.stockQuantity -= transferQty;
  destMed.stockQuantity += transferQty;

  // 2. Recalculate states
  refreshState();

  // 3. Create Transfer Order Record
  const newOrder: TransferOrder = {
    id: `TR-${destFac.state.slice(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`,
    sourceFacilityId,
    sourceFacilityName: sourceFac.name,
    sourceDistrict: sourceFac.district,
    sourceState: sourceFac.state,
    destinationFacilityId,
    destinationFacilityName: destFac.name,
    destinationDistrict: destFac.district,
    destinationState: destFac.state,
    medicineName: destMed.name,
    medicineId,
    quantity: transferQty,
    unit: destMed.unit,
    status: 'APPROVED',
    distanceKm: req.body.distanceKm || 85,
    estimatedTransportHours: req.body.estimatedTransportHours || 2.5,
    approvedBy: approvedBy || 'Dr. Sunita Verma',
    approvedRole: approvedRole || 'District Health Officer',
    approvalTimestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    coverageExtensionDays: Number(coverageExtensionDays || 12),
    donorRemainingDaysCoverage: Number(sourceMed.daysUntilStockout || 18),
    aiRationale: aiRationale || 'Automated multi-criteria surplus allocation validated by AI Copilot.',
    batchNumber: sourceMed.batchNumber,
    createdAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
  };

  transferOrders.unshift(newOrder);

  // 4. Create Immutable Audit Log
  const auditEntry: AuditRecord = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: newOrder.approvalTimestamp!,
    userRole: newOrder.approvedRole!,
    userName: newOrder.approvedBy!,
    action: 'TRANSFER_APPROVED',
    resourceType: destMed.name,
    source: `${sourceFac.name} (${sourceFac.district})`,
    destination: `${destFac.name} (${destFac.district})`,
    quantity: transferQty,
    reason: `Prevent predicted stock-out; coverage extended by +${newOrder.coverageExtensionDays} days`,
    status: 'APPROVED & DISPATCHED',
    hash: Math.random().toString(36).substring(2, 10)
  };
  auditLogs.unshift(auditEntry);

  res.json({
    success: true,
    transferOrder: newOrder,
    facilities,
    alerts,
    auditLogs
  });
});

app.post('/api/federated/run-round', (_req, res) => {
  federatedStatus = runFederatedRound(federatedStatus);

  const auditEntry: AuditRecord = {
    id: `AUD-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    userRole: 'National Administrator',
    userName: 'Dr. K. Swaminathan',
    action: 'FEDERATED_ROUND_EXECUTED',
    resourceType: `Global Model ${federatedStatus.globalModelVersion}`,
    source: `${federatedStatus.totalParticipatingStates} State Nodes (UP, BR, MH, KA, RJ)`,
    destination: 'Federated Global Model Registry',
    quantity: federatedStatus.stateNodes.reduce((acc, n) => acc + n.recordsProcessed, 0),
    reason: `Round ${federatedStatus.roundNumber} parameter aggregation (Loss reduced to ${federatedStatus.globalLoss})`,
    status: 'AGGREGATED',
    hash: Math.random().toString(36).substring(2, 10)
  };
  auditLogs.unshift(auditEntry);

  res.json({
    success: true,
    federatedStatus,
    auditLogs
  });
});

// -------------------------------------------------------------
// Google Gemini AI Endpoints
// -------------------------------------------------------------

// 1. AI Explanation of Predicted Shortages
app.post('/api/gemini/explain-risk', async (req, res) => {
  const { facilityName, medicineName, currentStock, dailyDemand, daysUntilStockout, supplierLeadDays, simulationContext, language } = req.body;
  const lang = language === 'hi' ? 'Hindi' : 'English';

  const prompt = `You are MediFlux AI, an expert epidemiological and healthcare logistics intelligence engine for India's public health system.
Analyze the following resource shortage risk for facility: "${facilityName}".
Medicine: "${medicineName}"
Current usable stock: ${currentStock} units
Surge daily consumption: ${dailyDemand} units/day
Days until stock-out: ${daysUntilStockout} days
Supplier replenishment lead time: ${supplierLeadDays} days
Active simulation / outbreak context: ${simulationContext || 'Baseline operations'}

Respond in ${lang}.
Provide a clinical and operational assessment in clean markdown:
1. **Root Cause Analysis**: Why this shortage is imminent (relationship between consumption acceleration vs supplier lead time).
2. **Clinical & Community Impact**: What happens to inpatient care and public health if stock is exhausted.
3. **Immediate Operational Protocol**: Prescriptive actions for the District Health Officer.
Keep it crisp, professional, authoritative, and concise (under 250 words).`;

  if (!ai) {
    // Deterministic fallback if API key is not yet set
    return res.json({
      text: lang === 'Hindi'
        ? `### जोखिम विश्लेषण: ${medicineName} (${facilityName})
- **मूल कारण**: वर्तमान स्टॉक (${currentStock}) अगले ${daysUntilStockout} दिनों में समाप्त हो जाएगा। आपूर्तिकर्ता का लीड समय ${supplierLeadDays} दिन है, जिससे ${Math.max(1, supplierLeadDays - Math.floor(daysUntilStockout))} दिनों का गंभीर स्टॉक-आउट गैप बन रहा है।
- **सामुदायिक प्रभाव**: डिहाइड्रेशन और मौसमी प्रकोप के मामलों में तत्काल प्राथमिक उपचार बाधित होगा।
- **सुझाया गया कदम**: निकटवर्ती अधिशेष केंद्र से तत्काल 1,000+ यूनिट की अंतर-जिला पुनर्वितरण स्वीकृति दें।`
        : `### Risk Assessment: ${medicineName} at ${facilityName}
- **Root Cause**: Consumption rate of ${dailyDemand} units/day depletes remaining ${currentStock} units within ${daysUntilStockout} days, while supplier lead time is ${supplierLeadDays} days. A critical ${Math.max(1, supplierLeadDays - Math.floor(daysUntilStockout))}-day void will occur before manufacturer replenishment.
- **Clinical Impact**: Dehydration management and inpatient stabilizing care will be compromised, causing sudden referral spikes to district hospitals.
- **Immediate Directive**: Authorize emergency inter-district redistribution from nearby surplus donor CHC within 24 hours.`
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });
    res.json({ text: response.text });
  } catch (err: any) {
    console.error('Gemini explain-risk error:', err);
    res.status(500).json({ error: err.message || 'Gemini API call failed' });
  }
});

// 2. Structured Recommendation Brief using Gemini Structured Output
app.post('/api/gemini/recommendation-brief', async (req, res) => {
  const { targetFacility, donorFacility, medicineName, transferQty, distanceKm, coverageGain, language } = req.body;
  const isHindi = language === 'hi';

  const prompt = `You are MediFlux AI. Generate a structured redistribution briefing for public health administrators.
Target Shortage Facility: ${targetFacility}
Proposed Donor Facility: ${donorFacility}
Medicine: ${medicineName}
Transfer Quantity: ${transferQty}
Transit Distance: ${distanceKm} km
Coverage Gain: +${coverageGain} days for target.

Return a JSON object conforming strictly to the requested schema.`;

  if (!ai) {
    return res.json({
      riskSummary: isHindi
        ? `${targetFacility} में ${medicineName} का स्टॉक क्रिटिकल स्तर पर है। ${donorFacility} से तत्काल अंतरण आवश्यक है।`
        : `${targetFacility} faces critical exhaustion of ${medicineName}. Prompt dispatch from ${donorFacility} provides immediate buffer stabilization.`,
      keyReasons: [
        isHindi ? 'दैनिक खपत में तीव्र वृद्धि' : 'Accelerated daily consumption surge',
        isHindi ? 'आपूर्तिकर्ता डिलीवरी में 7 दिनों का विलंब' : 'Supplier lead time exceeds remaining coverage',
        isHindi ? 'दाता केंद्र के पास पर्याप्त सुरक्षित अधिशेष उपलब्ध' : 'Donor maintains surplus well above safety reserve'
      ],
      recommendedAction: isHindi
        ? `स्वीकृति दें: ${donorFacility} से ${transferQty} यूनिट ${medicineName} तत्काल रवाना करें।`
        : `Approve expedited dispatch of ${transferQty} units of ${medicineName} from ${donorFacility}.`,
      priority: 'CRITICAL',
      expectedImpact: isHindi
        ? `कवरेज में +${coverageGain} दिनों की वृद्धि, रेफरल भार में 65% कमी।`
        : `Extends target operational coverage by +${coverageGain} days and mitigates emergency hospital referral load.`,
      caveats: [
        isHindi ? 'परिवहन के दौरान कोल्ड-चेन / तापमान अखंडता बनाए रखें' : 'Maintain temperature and packaging integrity during transit',
        isHindi ? 'प्राप्ति के 30 मिनट के भीतर डिजिटल रसीद दर्ज करें' : 'Acknowledge digital barcode handover upon arrival'
      ]
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskSummary: { type: Type.STRING },
            keyReasons: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendedAction: { type: Type.STRING },
            priority: { type: Type.STRING },
            expectedImpact: { type: Type.STRING },
            caveats: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['riskSummary', 'keyReasons', 'recommendedAction', 'priority', 'expectedImpact', 'caveats']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Gemini recommendation brief error:', err);
    res.status(500).json({ error: err.message || 'Gemini API call failed' });
  }
});

// 3. Emergency Simulation Insights
app.post('/api/gemini/simulation-insights', async (req, res) => {
  const { scenarioName, beforeStats, afterStats, language } = req.body;
  const lang = language === 'hi' ? 'Hindi' : 'English';

  const prompt = `You are MediFlux AI's chief epidemiologist. Evaluate the statewide healthcare stress for scenario: "${scenarioName}".
Metrics Comparison:
- Patient Footfall: ${beforeStats.totalPatients} -> ${afterStats.totalPatients} (+${afterStats.patientDiffPct}%)
- Critical Medicine Stock-outs: ${beforeStats.criticalMeds} -> ${afterStats.criticalMeds} facilities
- Bed Occupancy: ${beforeStats.avgBedOccupancy}% -> ${afterStats.avgBedOccupancy}%
- Staff Deficit: ${beforeStats.staffShortage} -> ${afterStats.staffShortage} personnel

Respond in ${lang}.
Provide:
1. **Epidemic Vulnerability Assessment**: Key stress points across district tiers.
2. **Resource Bottleneck Warning**: Specific commodities (ORS, IV Fluids, Antibiotics) and acute bed choke points.
3. **Strategic Countermeasures**: High-impact recommendations for state and district authorities.
Format in clean, executive-ready markdown.`;

  if (!ai) {
    return res.json({
      text: lang === 'Hindi'
        ? `### आपातकालीन परिदृश्य विश्लेषण: ${scenarioName}
- **प्रकोप संवेदनशीलता**: मरीज आवक में +${afterStats.patientDiffPct || 40}% वृद्धि से प्राथमिक स्वास्थ्य केंद्रों पर सीधा दबाव पड़ा है।
- **संसाधन अवरोध**: ${afterStats.criticalMeds} केंद्रों पर आवश्यक दवाओं का स्टॉक समाप्त होने का गंभीर जोखिम है। बिस्तर अधिभोग ${afterStats.avgBedOccupancy}% तक पहुंच गया है।
- **रणनीतिक सुझाव**: जिला अस्पतालों से प्राथमिक स्वास्थ्य केंद्रों में अधिशेष ओआरएस एवं आईवी तरल पदार्थों का तत्काल पुनर्वितरण करें।`
        : `### Strategic Scenario Analysis: ${scenarioName}
- **Vulnerability Assessment**: The +${afterStats.patientDiffPct || 40}% surge in patient footfall disproportionately strains PHCs and CHCs, triggering rapid inventory velocity.
- **Resource Bottlenecks**: ${afterStats.criticalMeds} facilities now face imminent stock-outs (notably ORS, IV fluids, and antipyretics), while bed occupancy climbs to ${afterStats.avgBedOccupancy}%.
- **Recommended Action**: Trigger inter-district redistribution from buffer CHCs and alert regional medical depots to expedite pending purchase orders.`
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });
    res.json({ text: response.text });
  } catch (err: any) {
    console.error('Gemini simulation insights error:', err);
    res.status(500).json({ error: err.message || 'Gemini API call failed' });
  }
});

// 4. Grounded AI Copilot Chat
app.post('/api/gemini/copilot', async (req, res) => {
  const { message, language } = req.body;
  const lang = language === 'hi' ? 'Hindi' : 'English';

  // Grounding telemetry context from live facilities
  const criticalFacilities = facilities.filter(f => f.overallRiskLevel === 'RED' || f.criticalMedicinesCount > 0);
  const upFacilities = facilities.filter(f => f.state === 'Uttar Pradesh');
  const lucknowFacilities = facilities.filter(f => f.district === 'Lucknow');
  const totalStockouts = facilities.reduce((sum, f) => sum + f.criticalMedicinesCount, 0);

  const contextData = {
    totalMonitoredFacilities: facilities.length,
    activeSimulation: activeSimulation ? activeSimulation.scenarioName : 'None (Baseline)',
    totalCriticalStockouts: totalStockouts,
    criticalFacilitiesList: criticalFacilities.map(f => ({
      name: f.name,
      district: f.district,
      state: f.state,
      risk: f.overallRiskLevel,
      bedOccupancy: `${f.bedOccupancyRate}%`,
      criticalMedicines: f.medicines.filter(m => m.riskLevel === 'RED').map(m => `${m.name} (${m.daysUntilStockout}d left)`)
    })),
    lucknowSummary: lucknowFacilities.map(f => ({
      name: f.name,
      risk: f.overallRiskLevel,
      orsStock: f.medicines.find(m => m.medicineId === 'MED-ORS')?.stockQuantity,
      orsDays: f.medicines.find(m => m.medicineId === 'MED-ORS')?.daysUntilStockout
    })),
    federatedLearningStatus: {
      version: federatedStatus.globalModelVersion,
      round: federatedStatus.roundNumber,
      globalLoss: federatedStatus.globalLoss,
      states: federatedStatus.stateNodes.map(s => s.stateName)
    }
  };

  const systemInstruction = `You are MediFlux AI Copilot, a healthcare intelligence assistant for India's public health administration.
You must answer queries using the LIVE telemetry data provided below.
CRITICAL RULES:
1. Do not invent fake statistics or imaginary facilities. Ground your answer strictly in the real system context provided.
2. If asked about Uttar Pradesh or Lucknow, mention actual facilities like 'PHC Lucknow Rural (Chinhat)' or 'PHC Malihabad' and their real stock metrics.
3. Answer naturally in ${lang}.
4. Provide structured, practical insights with bullets and numbers.`;

  if (!ai) {
    return res.json({
      text: lang === 'Hindi'
        ? `**मेडीफ्लक्स एआई रिपोर्ट**:
वर्तमान में निगरानी किए गए 30 केंद्रों में से **${criticalFacilities.length} केंद्र उच्च जोखिम** में हैं।
- **लखनऊ स्थिति**: 'PHC Lucknow Rural' में ओआरएस का स्टॉक केवल ${contextData.lucknowSummary[0]?.orsDays || 4.2} दिनों का शेष है।
- **सुझाया गया समाधान**: कानपुर नगर पूर्व सीएचसी के पास 7,400 ओआरएस का अधिशेष है, जिससे 1,200 यूनिट का अंतर-जिला स्थानांतरण सबसे उपयुक्त विकल्प है।`
        : `**MediFlux Intelligence Briefing**:
Across the 30 monitored facilities, **${criticalFacilities.length} facilities are currently under elevated stock-out risk**.
- **Lucknow District Focus**: PHC Lucknow Rural (Chinhat) has critical ORS coverage down to ${contextData.lucknowSummary[0]?.orsDays || 4.2} days under current demand.
- **Immediate Recommendation**: CHC Kanpur Nagar East has a surplus of 7,400 ORS sachets (85 km away). A transfer of 1,200 units will extend coverage by +12 days without depleting the donor's safety stock.`
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Telemetry Context: ${JSON.stringify(contextData)}\n\nUser Question: ${message}`,
      config: {
        systemInstruction
      }
    });
    res.json({ text: response.text });
  } catch (err: any) {
    console.error('Gemini copilot error:', err);
    res.status(500).json({ error: err.message || 'Gemini API call failed' });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Serve Setup
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[MediFlux AI Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
