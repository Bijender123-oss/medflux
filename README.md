# MediFlux AI
### Federated Intelligence for Healthcare Resource Management

> **Tagline:** Predicting Needs. Optimizing Resources.  
> **Powered by:** Google Gemini 3.8 Flash (`@google/genai` TypeScript SDK)  
> **Target Domain:** India's Public Healthcare Delivery Network (PHCs, CHCs, District Hospitals, State Health Missions)

---

## 1. Project Overview & Problem Statement

Public healthcare networks in India face acute structural challenges:
* **Asymmetric Resource Depletion:** While a frontline Primary Health Centre (PHC) experiences a sudden surge in acute diarrheal or dengue cases, an adjoining Community Health Centre (CHC) or district hospital just 85 km away often maintains untouched surplus reserves.
* **Delayed Central Procurement:** Formal procurement cycles and supplier replenishment lead times (typically 5 to 14 days) are too slow to avert sudden stock-outs during localized epidemics.
* **Data Silos & Privacy Constraints:** Raw facility-level patient records cannot easily be shared or centralized across state borders without severe privacy and compliance overhead.

**MediFlux AI** bridges this gap using:
1. **Deterministic Surge Forecasting Engine:** Transparent mathematical modeling of baseline demand, recent velocity trends, patient footfall multipliers, seasonal factors, and emergency outbreak shocks.
2. **Federated Intelligence Simulation:** Edge-trained statistical regression parameters across 5 states (Uttar Pradesh, Bihar, Maharashtra, Karnataka, Rajasthan) aggregated via server-side FedAvg without moving raw patient records.
3. **Multi-Criteria Redistribution Optimizer:** Recommends optimal donor-to-deficit resource transfers based on surplus margins, road distances, transit hours, batch expiry urgency, and telemetry reliability.
4. **Google Gemini 3.8 Flash Integration:** Structured clinical risk briefings, scenario interpretations, and grounded bilingual AI Copilot.
5. **Human-in-the-Loop Governance:** Authorized medical officers approve, modify, or reject redistribution proposals, immediately updating physical inventories and writing immutable audit logs.

---

## 2. 3-Minute Live Judge Demo Flow

Judges can verify the end-to-end journey in under 3 minutes:

1. **Login & Observe Baseline State:**
   - Active user defaults to **Dr. Sunita Verma** (Chief Medical Officer, Lucknow District).
   - In **National Overview**, select `State: Uttar Pradesh`, `District: Lucknow`.
   - Observe baseline inventories: **PHC Lucknow Rural (Chinhat)** has 1,450 units of ORS with ~6.0 days of normal coverage.
2. **Trigger Emergency Outbreak:**
   - Click the top demo bar button: **`[Simulate Dengue Surge (+40%)]`**.
   - The engine instantly recalculates:
     - Patient footfall surges by **+40%**.
     - ORS and IV fluid consumption velocity accelerates by **1.8x**.
     - Estimated days to stock-out plunges to **&lt; 4.0 days** (marked **RED: CRITICAL**).
     - Supplier replenishment lead time is 7 days, creating an acute 3+ day void.
3. **Ask Gemini Why (Risk Explanation):**
   - Click **`[Ask Gemini]`** on the critical alert card.
   - Gemini 3.8 Flash produces a clinical and operational root-cause analysis.
4. **Run Redistribution Optimizer:**
   - Click **`[Run Redistribution Optimizer]`** (or navigate to the Optimizer tab).
   - Target: `PHC Lucknow Rural (Chinhat)` | Deficit: `ORS (Oral Rehydration Salts)`.
   - The optimizer evaluates candidate facilities across the network.
   - **Recommended Donor:** `CHC Kanpur Nagar East (Kalyanpur)` (85 km away, ~2.4h transport, surplus of 7,400 units well above safety reserve, high telemetry reliability).
5. **Inspect Gemini Structured Briefing:**
   - Review the structured JSON briefing rendered on the right panel (`riskSummary`, `keyReasons`, `recommendedAction`, `expectedImpact`, `caveats`).
6. **Approve Transfer Order (Human in the Loop):**
   - Click **`[Approve Transfer]`**.
   - A simulated transfer order (`TR-UP-xxxx`) is generated and dispatched.
7. **Immediate Inventory & Risk Update:**
   - `CHC Kanpur Nagar East` stock decreases by 1,200 units (still safely above reserve).
   - `PHC Lucknow Rural` usable stock increases by 1,200 units.
   - Days-to-stockout extends to **~14.5 days**, reducing facility risk from **RED to GREEN/NORMAL**.
8. **Verify Immutable Audit Trail:**
   - Click **`[View in Audit Trail]`** to verify the cryptographic ledger hash, timestamp, authorizing officer, and rationale.

---

## 3. Mathematical Predictive Model

Rather than black-box random guesses, MediFlux AI employs a transparent deterministic formulation:

$$\text{Predicted Daily Demand} = \text{Baseline Demand} \times \text{Trend Factor} \times \text{Footfall Factor} \times \text{Seasonal Factor} \times \text{Emergency Multiplier}$$

* **Baseline Demand:** 30-day historical consumption average.
* **Trend Factor:** $\frac{\text{Last 7 Days Average Consumption}}{\text{30-Day Baseline Average}}$
* **Footfall Factor:** $\frac{\text{Patients Today}}{\text{7-Day Average Footfall}}$
* **Seasonal Factor:** Baseline seasonal adjustment (e.g. 1.25 for ORS during monsoon/diarrheal seasons).
* **Emergency Multiplier:** Dynamic coefficient derived from simulation shock parameters (e.g. 1.4 for +40% Dengue outbreak).

### Stock-out Coverage & Safety Stock:
$$\text{Days Until Stockout} = \frac{\text{Current Usable Stock}}{\text{Predicted Daily Demand}}$$
$$\text{Safety Stock Buffer} = \text{Predicted Daily Demand} \times (\text{Supplier Lead Days} + 3)$$

### Risk Classifications:
* **RED (Critical):** Coverage $\le 4$ days OR Stock &lt; 50% of Safety Buffer.
* **ORANGE (High):** Coverage $\le 7$ days OR Stock &lt; Safety Buffer.
* **YELLOW (Watch):** Coverage $\le 14$ days.
* **GREEN (Normal):** Coverage &gt; 14 days.

---

## 4. Federated Learning Simulation Architecture

* **5 Simulated State Edge Nodes:**
  - Uttar Pradesh (8 facilities, 28,400 records)
  - Bihar (6 facilities, 21,600 records)
  - Maharashtra (6 facilities, 24,800 records)
  - Karnataka (5 facilities, 18,200 records)
  - Rajasthan (5 facilities, 14,500 records)
* **Local Edge Training:** Each state calculates local coefficients:
  - $\theta_{\text{elasticity}}$, $\theta_{\text{seasonal}}$, $\theta_{\text{leadTime}}$, $\theta_{\text{outbreak}}$
* **FedAvg Server-Side Aggregation:**
  $$W_{\text{global}} = \sum_{k=1}^{K} \frac{n_k}{N} W_k$$
* **Judges Interaction:** Click **`[Execute Federated Aggregation Round]`** in the Federated AI tab to observe live parameter convergence, loss descent, and global model version increment (`v2.4 -> v2.5`).

---

## 5. Google Gemini AI Integration

All Gemini calls are executed strictly **server-side** via `@google/genai` TypeScript SDK:

```ts
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: { 'User-Agent': 'aistudio-build' }
  }
});
```

* **Model Used:** `gemini-3.8-flash`
* **Endpoints:**
  1. `POST /api/gemini/explain-risk`: Clinical root-cause evaluation.
  2. `POST /api/gemini/recommendation-brief`: Structured JSON output schema (`Type.OBJECT`) containing risk summary, key reasons, priority, impact, and caveats.
  3. `POST /api/gemini/simulation-insights`: Epidemiological shock assessment across district tiers.
  4. `POST /api/gemini/copilot`: Grounded conversational intelligence in English and Hindi (with speech recognition).

---

## 6. Demo User Roles & Credentials

Users can switch between realistic roles using the top-right header selector:

1. **Dr. Rajesh Sharma** – Medical Officer, PHC Lucknow Rural (`PHC_OFFICER`)
2. **Dr. Sunita Verma** – Chief Medical Officer (CMO), Lucknow District (`DISTRICT_OFFICER`)
3. **Sri Alok Saxena** – Director, National Health Mission, UP (`STATE_ADMIN`)
4. **Dr. K. Swaminathan** – Advisor, National Health Authority (`NATIONAL_ADMIN`)

---

## 7. Prototype vs. Production Architecture

| Dimension | Implemented in Prototype | Production-Scale Architecture |
|---|---|---|
| **Data Storage** | Seeded in-memory store with session persistence | Cloud SQL (PostgreSQL) + Redis Cache |
| **Federated Learning** | Client/Server simulated FedAvg rounds | PySyft / TensorFlow Federated edge daemon on State SDC servers |
| **Inventory Source** | 30 realistic Indian facilities (UP, BR, MH, KA, RJ) | Integration with Ayushman Bharat Digital Mission (ABDM) & e-Aushadhi APIs |
| **Authentication** | Role profile switcher with RBAC logic | ABDM Healthcare Professional Registry (HPR) OAuth 2.0 |
| **AI Model** | Google Gemini 3.8 Flash via `@google/genai` | Gemini 3.8 Flash + Fine-tuned Indian Disease Ontology |
| **Voice / Language** | Web Speech API + Dual Hindi/English UI | Multilingual Bhashini Voice APIs for 22 Indian regional languages |

---

## 8. Local Setup & Environment

1. **Dependencies:**
   ```bash
   npm install
   ```
2. **Environment Variables (`.env`):**
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   PORT=3000
   ```
3. **Run Full-Stack Dev Server:**
   ```bash
   npm run dev
   ```
   Server listens on `http://localhost:3000`.
