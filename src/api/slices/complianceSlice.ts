import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

/* -------------------------------------------------------------------------- */
/*  Types — mirror api/src/modules/compliance/schemas/compliance-rule.schema  */
/* -------------------------------------------------------------------------- */

export type ComplianceCategory =
  | "licensing"
  | "data_privacy"
  | "clinical_safety"
  | "infection_control"
  | "pharmacy_controlled_drugs"
  | "blood_safety"
  | "radiation_safety"
  | "staff_credentials"
  | "documentation"
  | "billing_finance"
  | "environmental_health"
  | "emergency_preparedness"
  | "other";

export type ComplianceSeverity = "low" | "medium" | "high" | "critical";

export type ComplianceFrequency =
  | "one_time"
  | "continuous"
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "biannual"
  | "annual";

export type ComplianceStatus = "draft" | "active" | "suspended" | "retired";

export type ComplianceModule =
  | "all"
  | "patients"
  | "wards"
  | "appointments"
  | "labs"
  | "radiology"
  | "pharmacy"
  | "blood_bank"
  | "maternity"
  | "emergency"
  | "theater"
  | "staff"
  | "finance";

type PersonRef = string | { _id: string; firstName?: string; lastName?: string; email?: string };

export interface ComplianceRevision {
  _id?: string;
  version: number;
  at: string;
  by?: PersonRef;
  changedFields: string[];
  previous: Record<string, unknown>;
}

export interface ComplianceRule {
  _id: string;
  company: string;
  code: string;
  title: string;
  description?: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  appliesTo: ComplianceModule[];
  regulatoryBody?: string;
  reference?: string;
  requirement?: string;
  evidenceRequired?: string;
  frequency: ComplianceFrequency;
  isMandatory: boolean;
  status: ComplianceStatus;
  effectiveDate?: string | null;
  expiryDate?: string | null;
  nextReviewDate?: string | null;
  owner?: PersonRef | null;
  tags: string[];
  version: number;
  /** only on GET /rules/:id */
  revisions?: ComplianceRevision[];
  createdBy?: PersonRef;
  updatedBy?: PersonRef;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ComplianceRulePayload = {
  code: string;
  title: string;
  description?: string;
  category: ComplianceCategory;
  severity?: ComplianceSeverity;
  appliesTo?: ComplianceModule[];
  regulatoryBody?: string;
  reference?: string;
  requirement?: string;
  evidenceRequired?: string;
  frequency?: ComplianceFrequency;
  isMandatory?: boolean;
  status?: ComplianceStatus;
  /** ISO date or yyyy-mm-dd */
  effectiveDate?: string;
  expiryDate?: string;
  nextReviewDate?: string;
  owner?: string;
  tags?: string[];
};

/** On edit, dates and owner can be cleared by sending null. */
export type ComplianceRuleUpdatePayload = Partial<
  Omit<ComplianceRulePayload, "effectiveDate" | "expiryDate" | "nextReviewDate" | "owner">
> & {
  effectiveDate?: string | null;
  expiryDate?: string | null;
  nextReviewDate?: string | null;
  owner?: string | null;
};

export interface ComplianceListParams {
  search?: string;
  category?: ComplianceCategory;
  severity?: ComplianceSeverity;
  status?: ComplianceStatus;
  module?: ComplianceModule;
  mandatory?: boolean;
  dueWithinDays?: number;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}

type Meta = { total: number; page: number; limit: number; pages: number };

export interface ComplianceState {
  rules: ComplianceRule[];
  meta: Meta | null;
  active: ComplianceRule | null;
  listLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: ComplianceState = {
  rules: [],
  meta: null,
  active: null,
  listLoading: false,
  detailLoading: false,
  saving: false,
  error: null,
  message: null,
};

/* -------------------------------------------------------------------------- */
/*  Thunks                                                                    */
/* -------------------------------------------------------------------------- */

const base = (facilityId: string) => `/companies/${facilityId}/compliance`;

export const fetchComplianceRules = createAsyncThunk<
  ApiSuccess<ComplianceRule[]>,
  { facilityId: string } & ComplianceListParams,
  { rejectValue: string }
>("compliance/fetchRules", async ({ facilityId, ...params }, { rejectWithValue }) => {
  try {
    const { data } = await api.get<ApiSuccess<ComplianceRule[]>>(`${base(facilityId)}/rules`, { params });
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err, "Failed to load compliance rules"));
  }
});

export const fetchComplianceRule = createAsyncThunk<
  ApiSuccess<ComplianceRule>,
  { facilityId: string; ruleId: string },
  { rejectValue: string }
>("compliance/fetchRule", async ({ facilityId, ruleId }, { rejectWithValue }) => {
  try {
    const { data } = await api.get<ApiSuccess<ComplianceRule>>(`${base(facilityId)}/rules/${ruleId}`);
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err, "Compliance rule not found"));
  }
});

export const createComplianceRule = createAsyncThunk<
  ApiSuccess<ComplianceRule>,
  { facilityId: string; payload: ComplianceRulePayload },
  { rejectValue: string }
>("compliance/createRule", async ({ facilityId, payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.post<ApiSuccess<ComplianceRule>>(`${base(facilityId)}/rules`, payload);
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err, "Could not add the compliance rule"));
  }
});

export const updateComplianceRule = createAsyncThunk<
  ApiSuccess<ComplianceRule> & { unchanged?: boolean },
  { facilityId: string; ruleId: string; payload: ComplianceRuleUpdatePayload },
  { rejectValue: string }
>("compliance/updateRule", async ({ facilityId, ruleId, payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch<ApiSuccess<ComplianceRule> & { unchanged?: boolean }>(
      `${base(facilityId)}/rules/${ruleId}`,
      payload,
    );
    return data;
  } catch (err) {
    return rejectWithValue(getErrorMessage(err, "Could not update the compliance rule"));
  }
});

export const deleteComplianceRule = createAsyncThunk<
  { id: string; message?: string },
  { facilityId: string; ruleId: string; reason?: string },
  { rejectValue: string }
>("compliance/deleteRule", async ({ facilityId, ruleId, reason }, { rejectWithValue }) => {
  try {
    const { data } = await api.delete<{ success: boolean; message?: string; id: string }>(
      `${base(facilityId)}/rules/${ruleId}`,
      { data: reason ? { reason } : undefined },
    );
    return { id: data.id || ruleId, message: data.message };
  } catch (err) {
    return rejectWithValue(getErrorMessage(err, "Could not delete the compliance rule"));
  }
});

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

const complianceSlice = createSlice({
  name: "compliance",
  initialState,
  reducers: {
    clearComplianceError(s) {
      s.error = null;
      s.message = null;
    },
    clearActiveComplianceRule(s) {
      s.active = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: ComplianceState, a: { payload?: string }) => {
      s.listLoading = false;
      s.detailLoading = false;
      s.saving = false;
      s.error = a.payload || "Request failed";
    };
    const saving = (s: ComplianceState) => {
      s.saving = true;
      s.error = null;
    };

    b.addCase(fetchComplianceRules.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchComplianceRules.fulfilled, (s, a) => {
        s.listLoading = false;
        s.rules = a.payload.data || [];
        s.meta = a.payload.meta || null;
      })
      .addCase(fetchComplianceRules.rejected, fail);

    b.addCase(fetchComplianceRule.pending, (s) => {
      s.detailLoading = true;
      s.error = null;
    })
      .addCase(fetchComplianceRule.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.active = a.payload.data || null;
      })
      .addCase(fetchComplianceRule.rejected, fail);

    b.addCase(createComplianceRule.pending, saving)
      .addCase(createComplianceRule.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Compliance rule added";
        if (a.payload.data) s.rules = [a.payload.data, ...s.rules];
      })
      .addCase(createComplianceRule.rejected, fail);

    b.addCase(updateComplianceRule.pending, saving)
      .addCase(updateComplianceRule.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.unchanged ? "No changes to save" : a.payload.message || "Compliance rule updated";
        const u = a.payload.data;
        if (!u) return;
        // The update response is not populated: keep the populated owner we already have.
        const merge = (old: ComplianceRule): ComplianceRule => ({
          ...old,
          ...u,
          owner: typeof u.owner === "string" && old.owner && typeof old.owner !== "string" && old.owner._id === u.owner ? old.owner : u.owner,
        });
        s.rules = s.rules.map((r) => (r._id === u._id ? merge(r) : r));
        if (s.active?._id === u._id) s.active = merge(s.active);
      })
      .addCase(updateComplianceRule.rejected, fail);

    b.addCase(deleteComplianceRule.pending, saving)
      .addCase(deleteComplianceRule.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Compliance rule deleted";
        s.rules = s.rules.filter((r) => r._id !== a.payload.id);
        if (s.meta) s.meta = { ...s.meta, total: Math.max(0, s.meta.total - 1) };
        if (s.active?._id === a.payload.id) s.active = null;
      })
      .addCase(deleteComplianceRule.rejected, fail);
  },
});

export const { clearComplianceError, clearActiveComplianceRule } = complianceSlice.actions;
export default complianceSlice.reducer;
