# Kshema (formerly HealthTribe)

<div align="center">
  <p align="center">
    <strong>Agentic AI Healthcare Platform: Orchestrated Clinical Workflows, Longitudinal Context, & Federated Identity</strong>
  </p>
  <p align="center">
    A full-stack clinical intelligence system bridging patient engagement and practitioner workflows via an AI orchestration layer, context-aware assistants, document intelligence, and longitudinal medical history.
  </p>
  <p align="center">
    <em>Built with React 19, TypeScript, Tailwind CSS v4, Express, Gemini 2.5 / Flash, and Groq Llama 3.3.</em>
  </p>
</div>

---

> [!NOTE]
> **Codebase Naming & Legacy Identifiers:**  
> This platform is presented as **Kshema**. The underlying repository contains legacy `HealthTribe` identifiers across internal file paths, package configs, REST API routes (`/api/v1/...`), database keys, and React components (`HealthTribeDomainEngine`, `healthtribe_logged_in_email`, etc.) to preserve backward compatibility with existing services.

---

## 📌 Positioning Statement

> **Kshema is an agentic healthcare intelligence platform built around an AI orchestration layer and specialized patient, clinician, document-intelligence, and longitudinal-context workflows.**
> 
> Rather than relying on generic, ungrounded conversational chatbots, Kshema uses an **agentic-inspired orchestration architecture**: incoming user requests are analyzed by an intent-and-action orchestrator that selectively retrieves structured application state (practitioner directories, medical timelines, active prescriptions, and appointments) before dispatching context to dedicated patient or clinical AI workflows.

---

## 🚀 Architectural Overview

```
                      +------------------------------------------------+
                      |               User Interaction Layer           |
                      |   - Patient Web Portal & Voice AI HUD (EN/HI/TE)|
                      |   - Clinical Practitioner Workspace Portal     |
                      |   - Multi-Channel Meta WhatsApp Adapter         |
                      +───────────────────────┬────────────────────────+
                                              │
                     HTTP / REST Requests (with Session & Profile Context)
                                              │
                                              ▼
                      +────────────────────────────────────────────────+
                      |         Express API Gateway & Session Core     |
                      |   - Multi-tenant User Storage (/data/users)    |
                      |   - In-Memory State Cache & File Proxy Sync    |
                      +───────────────────────┬────────────────────────+
                                              │
                                              ▼
                      +────────────────────────────────────────────────+
                      |             AI ORCHESTRATION LAYER             |
                      |         (PromptBuilder.buildOrchestration)     |
                      |   Evaluates user intent & selects data action: |
                      |   [FETCH_DOCTORS | FETCH_TIMELINE |            |
                      |    FETCH_MEDICATIONS | FETCH_APPOINTMENTS |    |
                      |    NONE]                                       |
                      +───────┬────────────────────────────────┬───────+
                              │                                │
            Application Data  │                                │  Selected Context
            Retrieval Phase   ▼                                ▼  Injection Phase
              ┌──────────────────────────────┐   ┌──────────────────────────────┐
              │ Platform Context Stores      │   │ Specialized AI Workflows     │
              │ - Verified Doctor Directory  │──▶│ 1. Patient Care Assistant    │
              │ - Longitudinal Timeline DB   │   │    (Grounded Patient Prompt) │
              │ - Active Prescriptions / Meds│   │ 2. Doctor Clinical Copilot   │
              │ - Scheduled Appointments     │   │    (Briefings & SOAP Notes)  │
              └──────────────────────────────┘   │ 3. Document Intelligence OCR │
                                                 │    (Biomarkers & Comparison) │
                                                 │ 4. ABHA Longitudinal Summary │
                                                 └──────────────┬───────────────┘
                                                                │
                                              ┌─────────────────┴─────────────────┐
                                              ▼                                   ▼
                               +─────────────────────────────+     +─────────────────────────────+
                               |     Gemini 2.5 / Flash      |     |    Llama 3.3 70B (Groq)     |
                               |  - Multimodal Vision & OCR  |     |  - High-Density Reasoning   |
                               |  - Fast Triage & Streaming  |     |  - Structured JSON Output   |
                               +─────────────────────────────+     +─────────────────────────────+
```

---

## 💡 Why Agentic AI?

Standard LLM chatbots exhibit severe architectural weaknesses when applied to digital healthcare:
1. **Lack of Application State Grounding:** A standard LLM operates in an isolated text bubble; it cannot see active appointments, available specialists, or current prescription lists without dedicated retrieval hooks.
2. **Hallucination of Clinical Facts:** Generic conversational models frequently invent medication regimens or clinical milestones when asked to summarize patient history.
3. **No Tool or Action Awareness:** Standard chatbots cannot decide whether a patient asking "Do I need to see someone for this chest tightness?" requires fetching local cardiologists or reviewing recent ECG entries.
4. **Isolated Document Parsing:** Extracting numbers from an uploaded lab report in isolation fails to tell the clinician or patient whether a specific biomarker (e.g., HbA1c or LDL) is *improving, worsening, or newly abnormal* compared to historical records.

### How Kshema Resolves This
Kshema implements a deterministic orchestration loop where the AI first acts as an **Action Classifier & Retrieval Planner**:
* Queries are first evaluated to decide if concrete application data must be pulled (`FETCH_DOCTORS`, `FETCH_TIMELINE`, `FETCH_MEDICATIONS`, `FETCH_APPOINTMENTS`).
* Retrieved domain records are injected as ground truth into specialized system instructions.
* The model produces both a **grounded response** and structured **interactive UI widgets** (such as doctor booking cards or chronological timeline items), anchoring conversational AI directly to native clinical operations.

---

## 🏥 Problem Being Addressed

| Dimension | Industry Problem | Kshema Verified Solution |
| :--- | :--- | :--- |
| **Data Fragmentation** | Patient records exist across disconnected clinics, paper files, and external hospital portals. | Chronological **Medical Timeline** aggregating local encounters, lab reports, and simulated **ABDM / ABHA** care context imports. |
| **Document Fatigue** | Clinicians spend excessive time deciphering physical lab PDFs, transcribing numbers, and typing consultation charts. | Multi-stage **Document Intelligence Pipeline** structuring biomarkers, comparing trends against timeline history, and drafting **SOAP notes**. |
| **Language Exclusion** | Medical reports and consultation summaries are predominantly written in dense clinical English. | Trilingual conversational interaction supporting **English, Hindi (हिन्दी), and Telugu (తెలుగు)** with Web Speech voice synthesis. |
| **Safety & Ambiguity** | Automated systems often silently guess or hallucinate smudged handwriting in physical prescriptions. | Clinical OCR pipeline with explicit **confidence thresholds** (<70), `unclearFlag` indicators, and mandatory human-in-the-loop review warnings. |

---

## 🔬 Core Agentic & AI Architecture

### 1. Realistic Interaction Flow (Query to Grounded Action)
```
User Query (Text / Voice / WhatsApp)
            │
            ▼
┌──────────────────────────────────────────────┐
│ AI Orchestrator (PromptBuilder.buildOrchestration) │
│ - Classifies intent                          │
│ - Selects action: FETCH_* or NONE            │
└──────────────────────┬───────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
   [Action: FETCH_*]          [Action: NONE]
          │                         │
┌───────────────────────┐           │
│ Application State     │           │
│ Retrieval:            │           │
│ - Query DB by action  │           │
│ - Filter by specialty │           │
│ - Bind top records    │           │
└──────────┬────────────┘           │
           │                        │
           └───────────┬────────────┘
                       ▼
┌──────────────────────────────────────────────┐
│ Specialized Workflow Execution               │
│ - Patient Assistant (Empathetic / Grounded)  │
│ - Doctor Copilot (Clinical Brief / SOAP)     │
│ - Trilingual Mandate applied (EN / HI / TE)  │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Structured Output + Client Widgets           │
│ - Conversational Markdown response           │
│ - Interactive UI Widget ("doctors", "timeline")
│ - Saved to conversation history & DB proxy   │
└──────────────────────────────────────────────┘
```

### 2. Document Intelligence & Longitudinal Ingestion Flow
```
Uploaded Medical Report (PDF / Image)
            │
            ▼
┌──────────────────────────────────────────────┐
│ Text Extraction Layer                        │
│ - Client-side: pdfjs-dist text stream parsing│
│ - Server-side: pdf-parse / inline image data │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Prior Timeline Retrieval                     │
│ - Fetches patient's historical records       │
│ - Gathers prior lab entries & biomarkers     │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ AI Clinical Structuring (buildOCRPrompt)     │
│ - Extracts report metadata & confidence %    │
│ - Normal vs. abnormal biomarker extraction   │
│ - Longitudinal trend mapping                 │
│   (Improving, Worsening, Stable, New)        │
│ - Actionable lifestyle & physician advice    │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Longitudinal Timeline Ingestion              │
│ - Automatically formats Timeline Event card  │
│ - Sets risk level (High / Moderate / Low)    │
│ - Appends structured finding highlights to DB│
│ - Surfaces into Doctor Copilot queue context │
└──────────────────────────────────────────────┘
```

---

## 🧩 Specialized AI Capabilities (Verified in Codebase)

### 1. AI Orchestration Layer
* **Implementation:** `server/ai/PromptBuilder.ts` (`buildOrchestrationPrompt`), `server.ts` (lines 4524–4562), `HealthTribeDomainEngine.ts` (lines 220–240).
* **Action Types:**
  - `FETCH_DOCTORS`: Triggered when users ask to consult or book a clinician; extracts medical specialty (e.g., Cardiologist, Dermatologist, General Physician) and queries `db.doctors`.
  - `FETCH_TIMELINE`: Triggered when users query their clinical background; retrieves longitudinal entries from `db.medicalTimeline`.
  - `FETCH_MEDICATIONS`: Fetches active prescription orders from `db.medicineOrders`.
  - `FETCH_APPOINTMENTS`: Fetches confirmed clinic visits from `db.appointments`.
  - `NONE`: Directly evaluates standard conversational questions.
* **Widget Binding:** Attaches structured widget metadata (`widgetType = "doctors" | "timeline"`) directly to the chat payload for interactive client rendering.

### 2. Patient AI Assistant / Companion
* **Implementation:** `PromptBuilder.ts` (`buildPatientPrompt`, `buildTriagePrompt`, `buildDietPrompt`, `buildInteractionPrompt`), `src/components/AICopilotWorkspace.tsx`.
* **Context Grounding:** Injects the active patient's demographic profile (age, gender, blood group, allergies, chronic conditions, current medications) alongside retrieved application records.
* **Strict Anti-Hallucination Guard:** Mandates that timeline summaries draw **exclusively** from the user's provided timeline events and consultations rather than generating generic medical history.
* **Ancillary Clinical Tools:**
  - **Symptom Triage Engine:** Classifies urgency into `RED`, `YELLOW`, or `GREEN`, returns specialty recommendations, emergency warnings, and home care tips (`/api/triage`).
  - **Drug Interaction Checker:** Cross-references active medications and patient allergies to flag high/moderate/low cross-reactions (`/api/interaction-check`).
  - **Post-Consultation Diet Planner:** Compiles scientific meal plans with food avoidance and recommendation lists tailored to patient diagnoses and dietary preferences (`/api/diet`).
  - **Trilingual Voice HUD:** Web Speech API integration supporting interactive spoken consultations in English, Hindi, and Telugu.

### 3. Doctor Clinical Copilot
* **Implementation:** `PromptBuilder.ts` (`buildDoctorPrompt`), `server.ts` (`/api/doctor-chat`), `src/components/DoctorChatbot.tsx`, and Doctor Workspace Mode in `AICopilotWorkspace.tsx`.
* **Clinical Context Binding:** Binds active clinician details, the selected patient queue (`doctorQueue`), vital stats, and historical timelines.
* **Structured Clinical Briefings:** Automatically formats patient records into 6 standardized briefing sections:
  1. *Overview*
  2. *Active Problems*
  3. *Medications*
  4. *Allergies*
  5. *Latest Lab Insights*
  6. *Suggested Next Actions*
* **SOAP Note Drafting:** Generates real-time Subjective, Objective, Assessment, and Plan drafts based on telemetry and encounter findings for practitioner review.
* **Important Safety Boundary:** Serves strictly as a documentation and decision-support tool. Does not diagnose patients or prescribe treatment independently.

### 4. Document Intelligence & OCR Pipeline
* **Implementation:** `server.ts` (`/api/analyze-report`, `/api/v1/prescriptions/upload-ocr`), `PromptBuilder.ts` (`buildOCRPrompt`), `src/App.tsx` (`extractTextFromPDF`).
* **Multi-Format Ingestion:** Extracts text from uploaded PDF files on the client using `pdfjs-dist` or on the server via `pdf-parse`, while processing image scans through multimodal vision.
* **Longitudinal Comparison:** Injects previous timeline records (`db.medicalTimeline`) into the OCR prompt so the AI can assign trend vectors (`Improving`, `Worsening`, `Stable`, `New`) to abnormal markers.
* **Prescription OCR Safety Checks:**
  - Evaluates extraction confidence (`HIGH`, `MEDIUM`, `LOW`).
  - Flags illegible handwriting with `unclearFlag: true` and confidence scores <70.
  - Adds explicit safety warnings: *"AI does not silently guess illegible text. Please review and manually confirm medication details before pharmacist dispatch."*
* **Automated Timeline Sync:** Ingested reports compile a structured `timelineEvent` object with highlights and risk scores (`High` vs `Low`) that is committed directly to the patient's medical timeline.

### 5. Medical Timeline & Longitudinal Context Engine
* **Implementation:** `src/components/HealthHistoryTimeline.tsx`, `server.ts` (`/api/timeline`), `server/ml/trajectoryForecaster.ts`, `server/ml/medicationReconciler.ts`.
* **Chronological Repository:** Maintains multi-year clinical encounters, lab analyses, prescription orders, and external hospital imports.
* **ABHA Record Integration:** Formats and summarizes imported ABDM care contexts using `PromptBuilder.buildABHAPrompt`.
* **Embedded ML & Statistical Analytics:**
  - **Biomarker Trajectory Forecaster (`/api/v1/ml/trajectory/:patientId`):** Uses Ordinary Least Squares (OLS) linear regression and Holt's Linear Trend exponential smoothing to project HbA1c, fasting glucose, systolic BP, and LDL trends with prediction intervals.
  - **Medication Reconciliation Engine (`/api/v1/ml/reconcile/:patientId`):** Uses an internal drug ontology and Jaro-Winkler / Levenshtein string similarity to detect cross-hospital duplicate molecules, dosage conflicts, and brand-to-generic equivalencies.

---

## 🔄 Example Multi-Step Workflow

Here is an end-to-end walkthrough demonstrating how the components cooperate:

```
Step 1: Patient Ingestion & Query
        Patient speaks to Voice HUD in Telugu: "నాకు గత రెండు రోజులుగా ఛాతీలో అసౌకర్యంగా ఉంది, నేను ఎవరిని సంప్రదించాలి?"
        (Translation: "I have had chest discomfort for 2 days, who should I consult?")

Step 2: Intent Classification & Orchestration
        PromptBuilder.buildOrchestrationPrompt classifies query:
        { "action": "FETCH_DOCTORS", "specialty": "Cardiologist", "reason": "Patient reports chest discomfort" }

Step 3: State Retrieval & Context Injection
        Server queries db.doctors for Cardiology specialists, retrieves Dr. Rahul Atluri,
        binds them as contextData, and injects the Telugu language mandate.

Step 4: Grounded Response Generation
        PromptBuilder.buildPatientPrompt generates an empathetic Telugu response explaining
        recommended precautions and embeds the "doctors" UI widget with doctor cards.

Step 5: Patient Uploads Prior Lab Report
        Patient uploads a diagnostic PDF ("Lipid_Panel_2026.pdf").
        Frontend extracts text with pdfjs-dist and sends it to /api/analyze-report with patientId.

Step 6: OCR Structuring & Longitudinal Comparison
        Backend retrieves historical timeline events (e.g. prior baseline LDL of 128 mg/dL).
        PromptBuilder.buildOCRPrompt extracts current LDL (146 mg/dL) and marks it:
        { "marker": "LDL Cholesterol", "status": "High", "trend": "Worsening" }
        Report is automatically committed to db.medicalTimeline with highlights and Moderate risk.

Step 7: Clinician Consultation & Copilot Briefing
        Patient enters Dr. Rahul Atluri's queue.
        Doctor workspace auto-binds the updated timeline, active vitals, and worsening lipid trend.
        DoctorChatbot generates a morning brief and pre-populates a clinical briefing.
        During consultation, the doctor triggers the AI SOAP note generator to draft consultation notes.
        Doctor reviews, edits, and finalizes the clinical chart.
```

---

## 🛡️ Human-in-the-Loop & Clinical Safety Framework

Kshema is built with explicit boundaries to ensure ethical, safe, and regulated digital health deployment:

* **No Autonomous Medical Decisions:** Kshema does **not** provide autonomous diagnostic determinations, does **not** autonomously prescribe medications, and does **not** execute autonomous clinical referrals.
* **Clinician Decision Support Only:** All doctor-facing briefing notes, SOAP drafts, and diagnostic suggestions are advisory and require human practitioner review, modification, and final sign-off.
* **Anti-Hallucination Constraints in Prescription Parsing:** In physical prescription OCR workflows (`/api/v1/prescriptions/upload-ocr`), the system explicitly rejects guessing unclear handwriting. Smudged or unreadable entries trigger `unclearFlag: true`, drop confidence below 70%, and generate mandatory manual verification alerts.
* **Triage Disclaimers & Emergency Routing:** Symptom triage outcomes are strictly risk-stratified educational suggestions (`RED`, `YELLOW`, `GREEN`) accompanied by immediate emergency guidance (108/911 callouts) for acute presentations.
* **Practitioner Audit Logging:** Actions in the clinician portal (reviewing records, inspecting summaries, generating SOAP notes) write structured records to the system audit trail.

---

## 📊 Current Implementation Status

### ✅ Implemented Now (Verified in Codebase)
* **AI Orchestration Layer:** Prompt-based intent classifier supporting `FETCH_DOCTORS`, `FETCH_TIMELINE`, `FETCH_MEDICATIONS`, `FETCH_APPOINTMENTS`, and `NONE`.
* **Interactive UI Widget Embedding:** Chatbot payloads dynamically attach renderable `doctors` and `timeline` component cards.
* **Context-Grounded Patient AI:** Profile-bound conversational companion with strict anti-fabrication guidelines and trilingual support (English, Hindi, Telugu).
* **Clinical Doctor Copilot & Chatbot:** High-density doctor portal assistant (`DoctorChatbot.tsx`) generating 6-part clinical briefings and SOAP notes.
* **Diagnostic Report Intelligence:** PDF text extraction (`pdfjs-dist` / `pdf-parse`), structured biomarker parsing, and trend comparison against timeline history.
* **Prescription OCR Safety Engine:** Structured prescription extraction with confidence scoring, `unclearFlag` detection, and manual verification warnings.
* **Longitudinal Medical Timeline:** Multi-year chronological card feed supporting local entries, lab highlights, and risk categorization.
* **Statistical ML Engines:**
  - Longitudinal biomarker trajectory forecasting using linear regression and Holt's exponential smoothing (`trajectoryForecaster.ts`).
  - Multi-hospital medication deduplication and brand-to-generic ontology mapping (`medicationReconciler.ts`).
* **Simulated ABDM / ABHA Gateway:** OTP-based verification handshake, dynamic consent lifecycle management, and multi-hospital care context import pipelines.
* **Multi-Channel Architecture:** Web client plus functional Meta WhatsApp webhook adapter (`server/channels/whatsapp`).
* **Resilient Infrastructure:** Multi-provider fallback (`GeminiProvider` and `GroqProvider`), exponential backoff retry handler, and file-isolated JSON user storage.

### 🔮 Possible Future Extensions (Planned / Not Yet Implemented)
* **Production ABDM Sandbox Bridge:** Connecting simulated NHA endpoints to live, production-certified National Health Authority gateway sandboxes.
* **Direct Hardware IoT Integration:** Streaming real-time telemetry from physical consumer wearables (Apple Watch, Fitbit, continuous glucose monitors) instead of simulated canvas feeds.
* **Ambient Consultation Transcription:** Background microphone transcription for physical clinical encounters to draft SOAP notes from conversational speech without manual input.
* **Digital Prescription Signing:** Cryptographic e-prescriptions signed with registered doctor digital certificates and Medical Council registry verification.
* **Broader Indic Language Coverage:** Expanding beyond English, Hindi, and Telugu to include Tamil, Kannada, Marathi, and Bengali speech synthesis models.

---

## 🛠️ Tech Stack & Engineering Specifications

| Layer | Technology | Role in Architecture |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, Vite 6 | High-speed component rendering, strict types, fast HMR |
| **Language** | TypeScript 5.8+ | End-to-end schema consistency across client and backend |
| **Styling & UI** | Tailwind CSS v4, Motion (Framer) | Modern `@theme` CSS variables, high-contrast accessible layouts |
| **Backend Runtime** | Express 4.21, Node.js 20+ | REST API routing, session management, domain engine |
| **AI Providers** | `@google/genai` (Gemini), `groq-sdk` | Multimodal OCR, intent orchestration, and structured JSON inference |
| **Document Processing**| `pdfjs-dist`, `pdf-parse` | Client-side and server-side text extraction from PDF reports |
| **Channel Transport** | Meta WhatsApp Cloud Webhooks | Omnichannel messaging via `WhatsAppAdapter` and `DomainIntentRouter` |
| **Production Bundler** | `esbuild` | Bundles Node.js backend into standalone `dist/server.cjs` CommonJS binary |

### Engineering Highlights

#### 1. Dual-Provider AI Interface
The system isolates generative model dependencies behind an abstract interface (`AIProvider.ts`) with dedicated adapters:
* `GeminiProvider.ts`: Connects to Google Gemini for multimodal vision and high-throughput conversational completion.
* `GroqProvider.ts`: Connects to Groq (`llama-3.3-70b-versatile`) for ultra-low latency JSON completions.

#### 2. Resilient Exponential Backoff
Generative calls are wrapped in `AIService.retryWithBackoff`:
```typescript
public static async retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0 || (error.status !== 429 && error.status !== 503)) {
      throw error;
    }
    console.warn(`[AI Service] Rate limited or server busy. Retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return this.retryWithBackoff(fn, retries - 1, delay * 2);
  }
}
```

#### 3. Automatic Session Context Injection
To eliminate passing user credentials manually across client components, `src/App.tsx` monkeypatches `window.fetch` to inject active user headers (`x-user-email`, `x-active-profile-id`) on every request.

#### 4. High-Performance Server Compilation
During build, Vite outputs client assets while `esbuild` bundles the Express application and domain engine into an optimized CommonJS bundle (`dist/server.cjs`):
```bash
vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs
```

---

## 📁 Repository Structure

```
├── /data/users             # Multi-tenant file-based user records (keyed by sanitized email)
├── /server                 # Backend Core & Specialized AI Services
│   ├── /ai
│   │   ├── AIProvider.ts       # Unified Generative Provider Interface
│   │   ├── AIService.ts        # Resilient AI service runner with exponential backoff
│   │   ├── GeminiProvider.ts   # Google Gemini SDK integration
│   │   ├── GroqProvider.ts     # Groq Llama-3.3-70B SDK integration
│   │   └── PromptBuilder.ts    # Central prompt factory (Orchestration, Patient, Doctor, OCR, ABHA)
│   ├── /channels
│   │   └── /whatsapp           # Omnichannel Meta WhatsApp Cloud API adapter & media handler
│   ├── /domain                 # Domain Engine, Command Router, and Session Manager
│   └── /ml
│       ├── medicationReconciler.ts # Brand-to-generic ontology & duplicate drug resolution
│       ├── trajectoryForecaster.ts # Longitudinal OLS & Holt exponential smoothing forecaster
│       └── verifyMlEngines.ts      # Statistical engine validation suite
│
├── /src                    # Frontend Application Client
│   ├── /components
│   │   ├── ABHAGateway.tsx          # ABDM Verification & Simulated Care Context Import
│   │   ├── AICopilotWorkspace.tsx   # Voice AI HUD, Patient/Doctor modes, Widget renderer
│   │   ├── DoctorChatbot.tsx        # Practitioner Workspace clinical copilot widget
│   │   ├── HealthHistoryTimeline.tsx# Chronological multi-year timeline with biomarker tags
│   │   ├── HealthTrajectoryCard.tsx # Visual forecasting charts for longitudinal metrics
│   │   ├── MedicationReconciliationCard.tsx # Cross-hospital prescription conflict viewer
│   │   ├── LiveECGMonitor.tsx       # Simulated cardiovascular vital telemetry canvas
│   │   └── ProfilePage.tsx          # Demographic & family vault management
│   │
│   ├── App.tsx             # Root router, patient/doctor dashboards, PDF extraction
│   ├── index.css           # Global Tailwind CSS v4 directives
│   ├── translations.ts     # Localization dictionaries (English, Hindi, Telugu)
│   └── types.ts            # Shared TypeScript interfaces and schemas
│
├── server.ts               # Core Express REST API entrypoint (legacy HealthTribe routes)
├── metadata.json           # Platform capabilities manifest
├── package.json            # Scripts and dependency specifications
└── .env.example            # Environment variable configuration template
```

---

## 🚀 Installation & Local Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **API Keys**: Google Gemini API key and/or Groq API key

### 1. Clone & Navigate
```bash
git clone https://github.com/Rohit-Andhavarapu/HealthTribe-version-1.1.git
cd HealthTribe-version-1.1
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the template into `.env.local` or `.env`:
```bash
cp .env.example .env.local
```
Provide your generative AI keys in `.env.local`:
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Optional WhatsApp Webhook Settings
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=healthtribe_secret_verify_token_2026
WHATSAPP_APP_SECRET=
```

### 4. Run Development Server
```bash
npm run dev
```
The application boots via `tsx` on port `3000`. Navigate to `http://localhost:3000` to access the portal.

### 5. Production Compilation
```bash
# Build frontend assets and bundle backend CommonJS binary
npm run build

# Start the optimized production server
npm run start
```

---

## 🔑 Key API Endpoints (Reference)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ai-conversations/:id/messages` | Primary AI conversation endpoint; triggers orchestration, context fetching, and model response |
| `POST` | `/api/doctor-chat` | Dedicated Doctor Clinical Copilot endpoint for briefings and practice queries |
| `POST` | `/api/analyze-report` | Diagnostic report analyzer parsing OCR text against previous timeline records |
| `POST` | `/api/v1/prescriptions/upload-ocr` | Prescription OCR parser with illegible handwriting safety detection |
| `GET` | `/api/timeline` | Retrieves longitudinal medical timeline for the active patient |
| `POST` | `/api/timeline` | Appends a structured medical or lab record to the longitudinal timeline |
| `POST` | `/api/triage` | Symptom triage returning structured urgency levels and home care recommendations |
| `POST` | `/api/interaction-check` | Analyzes active medications against patient allergies for adverse interactions |
| `POST` | `/api/diet` | Generates a tailored post-consultation diet plan |
| `GET` | `/api/v1/ml/trajectory/:patientId` | Computes statistical time-series forecasts on historical biomarker data |
| `GET` | `/api/v1/ml/reconcile/:patientId` | Evaluates cross-hospital prescriptions for molecule overlap and conflicts |
| `POST` | `/api/v1/abha/import/:patientId` | Initiates simulated ABDM care context import pipeline into the timeline |

---

## 👥 Authors & Acknowledgments

* **Rohit Andhavarapu** — Architecture, AI orchestration, full-stack implementation, and clinical workflows.
* Developed for high-performance clinical intelligence and federated digital health interoperability.
