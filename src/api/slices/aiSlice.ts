import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

/* -------------------------------------------------------------------------- */
/*  Types — mirror api/src/modules/ai (service responses + route bodies)      */
/* -------------------------------------------------------------------------- */

export type AiFeature = "diagnosis_helper" | "record_summary" | "risk_scoring" | "medication_safety";

export interface AiStatus {
  enabled: boolean;
  aiProviderConfigured: boolean;
  model: string | null;
  yourAccess: Record<AiFeature, boolean>;
  notes: string[];
}

export interface AiVitals {
  temperatureC?: number;
  pulse?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  respiratoryRate?: number;
  spo2?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  bloodGlucose?: number;
}

export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type News2Band = "low" | "low_medium" | "medium" | "high";
export type MedSeverity = "contraindicated" | "major" | "moderate" | "minor" | "caution";

export interface News2Result {
  applicable: boolean;
  note?: string;
  score: number;
  band: News2Band;
  parameters: Array<{ name: string; value: number; score: number }>;
  missing: string[];
  incomplete: boolean;
  assumptions: string[];
  response: string;
}

export interface QSofaResult {
  score: number;
  knownCriteria: number;
  positive: boolean;
  indeterminate: boolean;
  criteria: Array<{ name: string; met: boolean | null }>;
  note: string;
}

/** Common shape of the optional LLM layer on summary / risk / medication results. */
export interface AiLayer {
  available: boolean;
  used: boolean;
  error?: string;
  note?: string;
  limitations?: string[];
}

/* ---- request bodies ---- */
export type DiagnosisPayload = {
  patientId?: string;
  symptoms: string;
  duration?: string;
  ageYears?: number;
  sex?: "male" | "female" | "other";
  pregnant?: boolean;
  vitals?: AiVitals;
  examFindings?: string;
  investigations?: string;
  maxDifferentials?: number;
};
export type SummaryPayload = {
  patientId: string;
  focus?: "general" | "handover" | "referral" | "discharge";
  includeAi?: boolean;
};
export type RiskPayload = { patientId: string; vitals?: AiVitals; includeAi?: boolean };
export type MedicationPayload = {
  patientId?: string;
  medications?: Array<{ name: string; dose?: string; frequency?: string; route?: string }>;
  includeRecentPrescriptions?: boolean;
  allergies?: string[];
  includeAi?: boolean;
};

/* ---- results ---- */
export interface DiagnosisResult {
  summary: string;
  differentials: Array<{
    condition: string;
    likelihood: "high" | "moderate" | "low";
    rationale: string;
    supportingFindings: string[];
    againstFindings: string[];
    icdSearchTerm?: string;
    icdSuggestions: Array<{ code: string; title: string }>;
  }>;
  redFlags: string[];
  recommendedTests: Array<{ test: string; reason: string; urgency: "stat" | "urgent" | "routine" }>;
  immediateActions: string[];
  questionsToAsk: string[];
  limitations: string[];
  earlyWarning: { news2: News2Result; qsofa: QSofaResult } | null;
  patientContextUsed: boolean;
  icdNote?: string;
  disclaimer: string;
}

export interface SummaryResult {
  summary: {
    patient: { ageYears: number | null; sex?: string; bloodGroup?: string; status?: string };
    allergies: Array<{ substance: string; severity?: string; reaction?: string }>;
    activeDiagnoses: Array<{ title: string; icd11Code?: string; icd10Code?: string; status: string; certainty: string; type: string; since?: string }>;
    latestVitals: (AiVitals & { recordedAt?: string }) | null;
    currentAdmission: { admittedAt?: string; reason?: string; admittingDiagnosis?: string } | null;
    recentMedications: Array<{ name: string; dosage?: string; frequency?: string; route?: string; prescribedAt?: string }>;
    recentLabs: Array<{ test: string; value?: string; unit?: string; referenceRange?: string; abnormal?: boolean; at?: string }>;
    recentConsultations: Array<{ date?: string; complaint?: string; diagnosis?: string; icdCode?: string }>;
    dataCoverage: { vitalsReadings: number; diagnoses: number; consultations: number; labResults: number; medications: number };
  };
  ai: AiLayer & {
    focus?: string;
    headline?: string;
    narrative?: string;
    keyProblems?: string[];
    currentTreatment?: string[];
    outstanding?: string[];
    watchPoints?: string[];
  };
  disclaimer: string;
}

export interface RiskResult {
  scores: {
    overall: {
      level: RiskLevel;
      acuteLevel: RiskLevel;
      backgroundLevel: RiskLevel;
      backgroundPoints: number;
      drivers: Array<{ domain: string; label: string; points: number }>;
      method: string;
    };
    news2: News2Result | null;
    qsofa: QSofaResult;
    cardiometabolic: { bmi: number | null; bmiCategory: string | null; flags: string[] };
    background: { ageYears: number | null; activeConditions: number; recentMedications: number; abnormalLabsLast30Days: number };
    assumptions: string[];
    warnings: string[];
    vitalsUsed: (AiVitals & { source: string }) | null;
  };
  ai: AiLayer & {
    narrative?: string;
    suggestedActions?: Array<{ action: string; priority: "immediate" | "soon" | "routine"; rationale: string }>;
    monitoring?: string[];
  };
  disclaimer: string;
}

export interface MedicationFinding {
  type: "allergy" | "interaction" | "duplicate_therapy";
  severity: MedSeverity;
  drugs: string[];
  message: string;
  recommendation?: string;
  source: "rules" | "ai";
  origin?: "proposed" | "existing";
}

export interface MedicationResult {
  status: "stop" | "review" | "caution" | "no_issues_found";
  findings: MedicationFinding[];
  checked: Array<{ input: string; generic: string | null; classes: string[]; origin: "proposed" | "existing" }>;
  unrecognised: string[];
  unrecognisedNote?: string;
  allergiesChecked: number;
  patientContextUsed: boolean;
  ai: AiLayer;
  disclaimer: string;
}

/* -------------------------------------------------------------------------- */
/*  State                                                                     */
/* -------------------------------------------------------------------------- */

export interface AiRun<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const idle = <T>(): AiRun<T> => ({ data: null, loading: false, error: null });

export interface AiState {
  status: AiStatus | null;
  statusLoading: boolean;
  diagnostics: AiRun<DiagnosisResult>;
  summary: AiRun<SummaryResult>;
  risk: AiRun<RiskResult>;
  interactions: AiRun<MedicationResult>;
}

const initialState: AiState = {
  status: null,
  statusLoading: false,
  diagnostics: idle(),
  summary: idle(),
  risk: idle(),
  interactions: idle(),
};

/* -------------------------------------------------------------------------- */
/*  Thunks                                                                    */
/* -------------------------------------------------------------------------- */

const base = (facilityId: string) => `/companies/${facilityId}/ai`;

function mk<A, T>(type: string, fallback: string, fn: (arg: A) => Promise<ApiSuccess<T>>) {
  return createAsyncThunk<ApiSuccess<T>, A, { rejectValue: string }>(`ai/${type}`, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, fallback));
    }
  });
}

export const fetchAiStatus = mk<{ facilityId: string }, AiStatus>("fetchStatus", "Failed to load AI status", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/status`)).data);

export const runAiDiagnosis = mk<{ facilityId: string; payload: DiagnosisPayload }, DiagnosisResult>(
  "diagnosis",
  "The diagnosis helper could not complete",
  async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/diagnostics`, payload, { timeout: 90_000 })).data,
);

export const runAiSummary = mk<{ facilityId: string; payload: SummaryPayload }, SummaryResult>(
  "summary",
  "Could not build the record summary",
  async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/summary`, payload, { timeout: 90_000 })).data,
);

export const runAiRiskScoring = mk<{ facilityId: string; payload: RiskPayload }, RiskResult>(
  "risk",
  "Could not calculate the risk scores",
  async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/risk-scoring`, payload, { timeout: 90_000 })).data,
);

export const runAiMedicationCheck = mk<{ facilityId: string; payload: MedicationPayload }, MedicationResult>(
  "interactions",
  "Could not run the medication safety check",
  async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/interactions`, payload, { timeout: 90_000 })).data,
);

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

type RunKey = "diagnostics" | "summary" | "risk" | "interactions";

const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    clearAiResult(s, a: { payload: RunKey }) {
      s[a.payload] = idle() as never;
    },
    clearAllAiResults(s) {
      s.diagnostics = idle();
      s.summary = idle();
      s.risk = idle();
      s.interactions = idle();
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchAiStatus.pending, (s) => void (s.statusLoading = true))
      .addCase(fetchAiStatus.fulfilled, (s, a) => {
        s.statusLoading = false;
        s.status = a.payload.data;
      })
      .addCase(fetchAiStatus.rejected, (s) => void (s.statusLoading = false));

    const wire = <T,>(thunk: any, key: RunKey) => {
      b.addCase(thunk.pending, (s: AiState) => {
        s[key] = { data: null, loading: true, error: null } as never;
      })
        .addCase(thunk.fulfilled, (s: AiState, a: { payload: ApiSuccess<T> }) => {
          s[key] = { data: a.payload.data, loading: false, error: null } as never;
        })
        .addCase(thunk.rejected, (s: AiState, a: { payload?: string }) => {
          s[key] = { data: null, loading: false, error: a.payload || "Request failed" } as never;
        });
    };
    wire<DiagnosisResult>(runAiDiagnosis, "diagnostics");
    wire<SummaryResult>(runAiSummary, "summary");
    wire<RiskResult>(runAiRiskScoring, "risk");
    wire<MedicationResult>(runAiMedicationCheck, "interactions");
  },
});

export const { clearAiResult, clearAllAiResults } = aiSlice.actions;
export default aiSlice.reducer;
