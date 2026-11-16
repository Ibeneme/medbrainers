import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import api, { getErrorMessage, setTokens, type ApiSuccess } from "../services";
import { API_CONFIG } from "../config";
import type {
  ActiveFacilityDetails,
  AddMemberPayload,
  CreateFacilityPayload,
  Facility,
  FacilityMember,
  FacilityMemberDetail,
  FacilityMembership,
  InvitePayload,
  MyFacilitiesResponse,
  OutgoingInvite,
  PendingInvite,
  SwitchFacilityResponse,
  UpdateFacilityPayload,
  UserRole,
} from "../types";

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  staff: string[];
  isActive: boolean;
  id?: any
}

export interface IThemeModeColors {
  sidebarBg: string | null;
  activeColor: string | null;
}

export interface ICompanyTheme {
  defaultMode: 'dark' | 'light' | 'system';
  dark: IThemeModeColors;
  light: IThemeModeColors;
}

export interface FacilitiesState {
  list: FacilityMembership[];
  pendingInvites: FacilityMembership[] | PendingInvite[];
  outgoingInvites: OutgoingInvite[];
  departments: Department[];
  activeFacilityId: string | null;
  activeFacility: ActiveFacilityDetails | null;
  /** true once the first /companies/mine request has settled (success or failure) */
  initialized: boolean;
  current: Facility | null;
  currentTheme: ICompanyTheme | null;
  members: FacilityMember[];
  currentMemberDetail: FacilityMemberDetail | null;
  loading: boolean;
  departmentsLoading: boolean;
  membersLoading: boolean;
  memberDetailLoading: boolean;
  outgoingInvitesLoading: boolean;
  switching: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

/**
 * Cookie helper utilities to replace localStorage operations
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

/**
 * The active facility is remembered in a cookie so the dashboard has it on
 * the very first render after a reload/login, instead of flashing
 * "Select a facility first" until /companies/mine returns. The server value
 * still wins as soon as it arrives.
 */
function loadPersistedFacility(): {
  activeFacilityId: string | null;
  activeFacility: ActiveFacilityDetails | null;
} {
  const empty = { activeFacilityId: null, activeFacility: null };
  if (typeof window === "undefined") return empty;
  try {
    const raw = getCookie(API_CONFIG.ACTIVE_FACILITY_KEY);
    const accessToken = getCookie(API_CONFIG.ACCESS_TOKEN_KEY);
    if (!raw || !accessToken) return empty;
    const parsed = JSON.parse(decodeURIComponent(raw));
    return {
      activeFacilityId: typeof parsed?.activeFacilityId === "string" ? parsed.activeFacilityId : null,
      activeFacility: parsed?.activeFacility ?? null,
    };
  } catch {
    return empty;
  }
}

const persisted = loadPersistedFacility();

const initialState: FacilitiesState = {
  list: [],
  pendingInvites: [],
  outgoingInvites: [],
  departments: [],
  activeFacilityId: persisted.activeFacilityId,
  activeFacility: persisted.activeFacility,
  initialized: false,
  current: null,
  currentTheme: null,
  members: [],
  currentMemberDetail: null,
  loading: false,
  departmentsLoading: false,
  membersLoading: false,
  memberDetailLoading: false,
  outgoingInvitesLoading: false,
  switching: false,
  saving: false,
  error: null,
  message: null,
};

export const fetchMyFacilities = createAsyncThunk(
  "facilities/fetchMyFacilities",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<MyFacilitiesResponse>>("/companies/mine");
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load facilities"));
    }
  },
);

export const fetchFacility = createAsyncThunk(
  "facilities/fetchFacility",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<Facility>>(`/companies/${facilityId}`);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Facility not found"));
    }
  },
);

export const createFacility = createAsyncThunk(
  "facilities/createFacility",
  async (payload: CreateFacilityPayload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<
        ApiSuccess<{ company: Facility; membership: { company: string; role: UserRole; roles?: UserRole[] } }>
      >("/companies", payload);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not create facility"));
    }
  },
);

export const updateFacility = createAsyncThunk(
  "facilities/updateFacility",
  async (
    { facilityId, payload }: { facilityId: string; payload: UpdateFacilityPayload },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<Facility>>(
        `/companies/${facilityId}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update facility"));
    }
  },
);

export const uploadFacilityLogo = createAsyncThunk(
  "facilities/uploadLogo",
  async ({ facilityId, file }: { facilityId: string; file: File }, { rejectWithValue }) => {
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post<ApiSuccess<Facility>>(
        `/companies/${facilityId}/logo`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not upload logo"));
    }
  },
);

export const transferFacilityOwnership = createAsyncThunk(
  "facilities/transferOwnership",
  async (
    { facilityId, newOwnerId }: { facilityId: string; newOwnerId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<
        ApiSuccess<{ companyId: string; ownerId: string; previousOwnerId: string }>
      >(`/companies/${facilityId}/transfer-ownership`, { newOwnerId });
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not transfer ownership"));
    }
  },
);

export const switchFacility = createAsyncThunk(
  "facilities/switchFacility",
  async (companyId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.post<ApiSuccess<SwitchFacilityResponse>>(
        "/users/me/switch-company",
        { companyId },
      );
      const result = data.data;
      if (result.accessToken) {
        const refresh = getCookie(API_CONFIG.REFRESH_TOKEN_KEY) || undefined;
        setTokens(result.accessToken, refresh);
      }
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not switch facility"));
    }
  },
);

// --- Theme & Color Thunks ---
export const fetchCompanyTheme = createAsyncThunk(
  "facilities/fetchTheme",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<ICompanyTheme>>(`/companies/${facilityId}/theme`);
      return { ...data, facilityId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load facility theme"));
    }
  },
);

export const updateModeColors = createAsyncThunk(
  "facilities/updateModeColors",
  async (
    {
      facilityId,
      mode,
      sidebarBg,
      activeColor,
    }: {
      facilityId: string;
      mode: 'dark' | 'light';
      sidebarBg?: string | null;
      activeColor?: string | null;
    },
    { rejectWithValue },
  ) => {
    try {
      const body: {
        mode: "dark" | "light";
        sidebarBg?: string | null;
        activeColor?: string | null;
      } = { mode };
      if (sidebarBg !== undefined) body.sidebarBg = sidebarBg;
      if (activeColor !== undefined) body.activeColor = activeColor;
      const { data } = await api.patch<ApiSuccess<Facility>>(
        `/companies/${facilityId}/theme/colors`,
        body,
      );
      return { ...data, facilityId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update theme colors"));
    }
  },
);

export const updateDefaultMode = createAsyncThunk(
  "facilities/updateDefaultMode",
  async (
    {
      facilityId,
      defaultMode,
    }: {
      facilityId: string;
      defaultMode: 'dark' | 'light' | 'system';
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<Facility>>(
        `/companies/${facilityId}/theme/default-mode`,
        { defaultMode },
      );
      return { ...data, facilityId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update default mode"));
    }
  },
);

export const resetCompanyTheme = createAsyncThunk(
  "facilities/resetTheme",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.post<ApiSuccess<Facility>>(`/companies/${facilityId}/theme/reset`);
      return { ...data, facilityId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not reset theme configuration"));
    }
  },
);

// --- Department Thunks ---
export const fetchDepartments = createAsyncThunk(
  "facilities/fetchDepartments",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<Department[]>>(`/companies/${facilityId}/departments`);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load departments"));
    }
  },
);

export const addDepartment = createAsyncThunk(
  "facilities/addDepartment",
  async (
    { facilityId, payload }: { facilityId: string; payload: { name: string; code: string; description?: string; staff?: string[] } },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Department>>(`/companies/${facilityId}/departments`, payload);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add department"));
    }
  },
);

export const updateDepartment = createAsyncThunk(
  "facilities/updateDepartment",
  async (
    {
      facilityId,
      departmentId,
      payload,
    }: {
      facilityId: string;
      departmentId: string;
      payload: Partial<{ name: string; code: string; description: string; staff: string[]; isActive: boolean }>;
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<Department>>(
        `/companies/${facilityId}/departments/${departmentId}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update department"));
    }
  },
);

export const removeDepartment = createAsyncThunk(
  "facilities/removeDepartment",
  async ({ facilityId, departmentId }: { facilityId: string; departmentId: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.delete<ApiSuccess<{ success: boolean }>>(
        `/companies/${facilityId}/departments/${departmentId}`,
      );
      return { ...data, departmentId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not remove department"));
    }
  },
);

export const fetchFacilityMembers = createAsyncThunk(
  "facilities/fetchMembers",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<FacilityMember[]>>(
        `/companies/${facilityId}/members`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load members"));
    }
  },
);

export const fetchFacilityMemberDetail = createAsyncThunk(
  "facilities/fetchMemberDetail",
  async ({ facilityId, memberId }: { facilityId: string; memberId: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<FacilityMemberDetail>>(
        `/companies/${facilityId}/members/${memberId}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not load member details"));
    }
  },
);

export const addFacilityMember = createAsyncThunk(
  "facilities/addMember",
  async (
    { facilityId, payload }: { facilityId: string; payload: AddMemberPayload },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess>(`/companies/${facilityId}/members`, payload);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add member"));
    }
  },
);

export const inviteToFacility = createAsyncThunk(
  "facilities/invite",
  async (
    { facilityId, payload }: { facilityId: string; payload: InvitePayload },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess>(`/companies/${facilityId}/invites`, payload);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Invite failed"));
    }
  },
);

export const fetchOutgoingInvites = createAsyncThunk(
  "facilities/fetchOutgoingInvites",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<OutgoingInvite[]>>(
        `/companies/${facilityId}/invites`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load invitations"));
    }
  },
);

export const resendFacilityInvite = createAsyncThunk(
  "facilities/resendInvite",
  async (
    {
      facilityId,
      inviteId,
      email,
    }: { facilityId: string; inviteId?: string; email?: string },
    { rejectWithValue },
  ) => {
    try {
      if (inviteId) {
        const { data } = await api.post<ApiSuccess>(
          `/companies/${facilityId}/invites/${inviteId}/resend`,
        );
        return data;
      }
      const { data } = await api.post<ApiSuccess>(`/companies/${facilityId}/invites/resend`, {
        email,
      });
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to resend invitation"));
    }
  },
);

export const retractFacilityInvite = createAsyncThunk(
  "facilities/retractInvite",
  async (
    {
      facilityId,
      inviteId,
      email,
    }: { facilityId: string; inviteId?: string; email?: string },
    { rejectWithValue },
  ) => {
    try {
      if (inviteId) {
        const { data } = await api.delete<ApiSuccess>(
          `/companies/${facilityId}/invites/${inviteId}`,
        );
        return { ...data, inviteId, email };
      }
      const { data } = await api.post<ApiSuccess>(`/companies/${facilityId}/invites/retract`, {
        email,
      });
      return { ...data, inviteId, email };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to retract invitation"));
    }
  },
);

export const fetchPendingInvites = createAsyncThunk(
  "facilities/fetchPendingInvites",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<PendingInvite[]>>("/companies/invites/pending");
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load invitations"));
    }
  },
);

export const acceptInvite = createAsyncThunk(
  "facilities/acceptInvite",
  async (dto: { token?: string; companyId?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post<ApiSuccess>("/companies/invites/accept", dto);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not accept invitation"));
    }
  },
);

export const rejectInvite = createAsyncThunk(
  "facilities/rejectInvite",
  async (dto: { token?: string; companyId?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post<ApiSuccess>("/companies/invites/reject", dto);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not decline invitation"));
    }
  },
);

export const updateFacilityMember = createAsyncThunk(
  "facilities/updateMember",
  async (
    {
      facilityId,
      memberId,
      payload,
    }: {
      facilityId: string;
      memberId: string;
      payload: { role?: UserRole; roles?: UserRole[]; addRoles?: UserRole[]; removeRoles?: UserRole[]; department?: string; isActive?: boolean };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<
        ApiSuccess<{ userId: string; role: UserRole; roles: UserRole[]; department?: string; isActive: boolean }>
      >(`/companies/${facilityId}/members/${memberId}`, payload);
      return { ...data, memberId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update member"));
    }
  },
);

export const removeFacilityMember = createAsyncThunk(
  "facilities/removeMember",
  async (
    { facilityId, memberId }: { facilityId: string; memberId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.delete<ApiSuccess>(
        `/companies/${facilityId}/members/${memberId}`,
      );
      return { ...data, memberId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not remove member"));
    }
  },
);

export const leaveFacility = createAsyncThunk(
  "facilities/leave",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.post<ApiSuccess<{ activeCompanyId: string | null }>>(
        `/companies/${facilityId}/leave`,
      );
      return { ...data, facilityId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not leave facility"));
    }
  },
);

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

const EMPTY_THEME = (): ICompanyTheme => ({
  defaultMode: "system",
  dark: { sidebarBg: null, activeColor: null },
  light: { sidebarBg: null, activeColor: null },
});

/** Accept either a theme object or a company document that contains `.theme`. */
export function normalizeCompanyTheme(input: unknown): ICompanyTheme | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as {
    theme?: unknown;
    dark?: IThemeModeColors;
    light?: IThemeModeColors;
    defaultMode?: string;
  };
  const theme =
    raw.theme && typeof raw.theme === "object"
      ? (raw.theme as typeof raw)
      : raw;
  if (!("dark" in theme) && !("light" in theme) && !("defaultMode" in theme)) {
    return null;
  }
  const mode = (colors?: Partial<IThemeModeColors> | null): IThemeModeColors => ({
    sidebarBg:
      typeof colors?.sidebarBg === "string" && HEX_COLOR_RE.test(colors.sidebarBg)
        ? colors.sidebarBg
        : null,
    activeColor:
      typeof colors?.activeColor === "string" && HEX_COLOR_RE.test(colors.activeColor)
        ? colors.activeColor
        : null,
  });
  const defaultMode =
    theme.defaultMode === "dark" || theme.defaultMode === "light" || theme.defaultMode === "system"
      ? theme.defaultMode
      : "system";
  return {
    defaultMode,
    dark: mode(theme.dark),
    light: mode(theme.light),
  };
}

function themeFromApiPayload(payload: { data?: unknown } | null | undefined): ICompanyTheme | null {
  if (!payload) return null;
  if (payload.data !== undefined) {
    const fromData = normalizeCompanyTheme(payload.data);
    if (fromData) return fromData;
  }
  return normalizeCompanyTheme(payload);
}

function sameActiveFacility(state: FacilitiesState, facilityId?: string | null) {
  if (!facilityId || !state.activeFacilityId) return true;
  return String(facilityId) === String(state.activeFacilityId);
}

const facilitiesSlice = createSlice({
  name: "facilities",
  initialState,
  reducers: {
    clearFacilitiesError(state) {
      state.error = null;
      state.message = null;
    },
    clearCurrentMemberDetail(state) {
      state.currentMemberDetail = null;
    },
    setActiveFacilityFromLogin(
      state,
      action: PayloadAction<{
        activeFacilityId?: string | null;
        activeFacility?: ActiveFacilityDetails | null;
        pendingInvites?: PendingInvite[];
      }>,
    ) {
      if (action.payload.activeFacilityId !== undefined) {
        state.activeFacilityId = action.payload.activeFacilityId;
      }
      if (action.payload.activeFacility !== undefined) {
        state.activeFacility = action.payload.activeFacility;
      }
      if (action.payload.pendingInvites) {
        state.pendingInvites = action.payload.pendingInvites;
      }
    },
    /**
     * Optimistic facility colour change.
     * Null means "use the product default" for that slot.
     */
    patchFacilityTheme(
      state,
      action: PayloadAction<{
        mode: "dark" | "light";
        sidebarBg?: string | null;
        activeColor?: string | null;
      }>,
    ) {
      const base = state.currentTheme ?? EMPTY_THEME();
      const mode = action.payload.mode;
      const prev = base[mode] ?? { sidebarBg: null, activeColor: null };
      state.currentTheme = {
        ...base,
        [mode]: {
          sidebarBg:
            action.payload.sidebarBg !== undefined ? action.payload.sidebarBg : prev.sidebarBg,
          activeColor:
            action.payload.activeColor !== undefined
              ? action.payload.activeColor
              : prev.activeColor,
        },
      };
    },
  },
  extraReducers: (builder) => {
    const pending = (state: FacilitiesState) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    };
    const rejected = (state: FacilitiesState, action: { payload: unknown }) => {
      state.loading = false;
      state.switching = false;
      state.departmentsLoading = false;
      state.membersLoading = false;
      state.memberDetailLoading = false;
      state.saving = false;
      state.error = (action.payload as string) || "Request failed";
    };

    builder
      .addCase(fetchMyFacilities.pending, pending)
      .addCase(fetchMyFacilities.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        const d = action.payload.data;
        state.list = d.companies || [];
        state.pendingInvites = d.pendingInvites || [];
        state.activeFacilityId = d.activeCompanyId;
        if (d.activeCompanyId) {
          const m = d.companies?.find((c: any) => {
            const id =
              typeof c.company === "string"
                ? c.company
                : c.company?._id || (c.company as Facility)?.id;
            return String(id) === String(d.activeCompanyId);
          });
          if (m && typeof m.company === "object" && m.company) {
            state.activeFacility = {
              id: String(m.company._id || m.company.id),
              name: m.company.name,
              slug: m.company.slug,
              logo: m.company.logo,
              role: m.role,
              roles: m.roles,
              department: m.department,
            };
            const embedded = normalizeCompanyTheme((m.company as { theme?: unknown }).theme);
            if (embedded) state.currentTheme = embedded;
          }
        }
      })
      .addCase(fetchMyFacilities.rejected, (state, action) => {
        state.initialized = true;
        rejected(state, action);
      });

    builder
      .addCase(fetchFacility.pending, pending)
      .addCase(fetchFacility.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload.data;
        const loaded = normalizeCompanyTheme(action.payload.data);
        if (loaded) state.currentTheme = loaded;
      })
      .addCase(fetchFacility.rejected, rejected);

    // Theme & Color Reducers
    // A missing/failed theme must NOT flip the global facilities error —
    // the dashboard just keeps the product defaults.
    builder
      .addCase(fetchCompanyTheme.fulfilled, (state, action) => {
        if (!sameActiveFacility(state, action.payload.facilityId)) return;
        state.currentTheme = themeFromApiPayload(action.payload) ?? EMPTY_THEME();
      })
      .addCase(fetchCompanyTheme.rejected, () => { });

    builder
      .addCase(updateModeColors.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateModeColors.fulfilled, (state, action) => {
        state.saving = false;
        state.message = action.payload.message || "Theme colors updated";
        if (!sameActiveFacility(state, action.payload.facilityId)) return;
        const next = themeFromApiPayload(action.payload);
        if (next) {
          state.currentTheme = next;
          if (action.payload.data && (action.payload.data as Facility)._id) {
            state.current = action.payload.data;
          }
        }
      })
      .addCase(updateModeColors.rejected, rejected);

    builder
      .addCase(updateDefaultMode.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateDefaultMode.fulfilled, (state, action) => {
        state.saving = false;
        state.message = action.payload.message || "Default display mode updated";
        if (!sameActiveFacility(state, action.payload.facilityId)) return;
        const next = themeFromApiPayload(action.payload);
        if (next) {
          state.currentTheme = next;
          if (action.payload.data && (action.payload.data as Facility)._id) {
            state.current = action.payload.data;
          }
        }
      })
      .addCase(updateDefaultMode.rejected, rejected);

    builder
      .addCase(resetCompanyTheme.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(resetCompanyTheme.fulfilled, (state, action) => {
        state.saving = false;
        state.message = action.payload.message || "Theme reset to defaults";
        if (!sameActiveFacility(state, action.payload.facilityId)) return;
        state.currentTheme = themeFromApiPayload(action.payload) ?? EMPTY_THEME();
        if (action.payload.data && (action.payload.data as Facility)._id) {
          state.current = action.payload.data;
        }
      })
      .addCase(resetCompanyTheme.rejected, rejected);

    // Departments Reducers
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.departmentsLoading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action: any) => {
        state.departmentsLoading = false;

        // Handle both direct array responses or wrapped { success, data } responses safely
        const responseData = action.payload?.data !== undefined ? action.payload.data : action.payload;
        const rawDepts = Array.isArray(responseData) ? responseData : [];

        // Deduplicate departments by _id
        const uniqueMap = new Map();
        for (const dept of rawDepts) {
          if (dept && (dept._id || dept.id)) {
            uniqueMap.set(dept._id || dept.id, dept);
          }
        }
        state.departments = Array.from(uniqueMap.values());
      })
      .addCase(fetchDepartments.rejected, rejected);

    builder
      .addCase(addDepartment.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addDepartment.fulfilled, (state, action) => {
        state.saving = false;
        state.message = action.payload.message || "Department added";
        if (action.payload.data) {
          state.departments.push(action.payload.data);
        }
      })
      .addCase(addDepartment.rejected, rejected);

    builder
      .addCase(updateDepartment.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.saving = false;
        state.message = action.payload.message || "Department updated";
        if (action.payload.data) {
          const updated = action.payload.data;
          const index = state.departments.findIndex((d) => d._id === updated._id);
          if (index !== -1) {
            state.departments[index] = updated;
          }
        }
      })
      .addCase(updateDepartment.rejected, rejected);

    builder
      .addCase(removeDepartment.fulfilled, (state, action) => {
        state.message = action.payload.message || "Department removed";
        state.departments = state.departments.filter((d) => d._id !== action.payload.departmentId);
      })
      .addCase(removeDepartment.rejected, rejected);

    builder
      .addCase(createFacility.pending, pending)
      .addCase(createFacility.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || "Facility created";
        const company = action.payload.data.company;
        state.current = company;
        const createdTheme = normalizeCompanyTheme(company);
        if (createdTheme) state.currentTheme = createdTheme;
        state.activeFacilityId = company._id;
        state.activeFacility = {
          id: company._id,
          name: company.name,
          slug: company.slug,
          logo: company.logo,
          role: action.payload.data.membership?.role || "ceo",
          roles: action.payload.data.membership?.roles || ["ceo"],
        };
      })
      .addCase(createFacility.rejected, rejected);

    builder
      .addCase(updateFacility.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateFacility.fulfilled, (state, action) => {
        state.saving = false;
        state.message = action.payload.message || "Facility updated";
        state.current = action.payload.data;
        const updatedTheme = normalizeCompanyTheme(action.payload.data);
        if (updatedTheme) state.currentTheme = updatedTheme;
        if (state.activeFacility && state.activeFacility.id === action.payload.data._id) {
          state.activeFacility = {
            ...state.activeFacility,
            name: action.payload.data.name,
            slug: action.payload.data.slug,
            logo: action.payload.data.logo,
          };
        }
      })
      .addCase(updateFacility.rejected, rejected);

    builder
      .addCase(uploadFacilityLogo.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(uploadFacilityLogo.fulfilled, (state, action) => {
        state.saving = false;
        state.message = action.payload.message || "Logo updated";
        state.current = action.payload.data;
        if (state.activeFacility && state.activeFacility.id === action.payload.data._id) {
          state.activeFacility = {
            ...state.activeFacility,
            logo: action.payload.data.logo,
          };
        }
      })
      .addCase(uploadFacilityLogo.rejected, rejected);

    builder
      .addCase(transferFacilityOwnership.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(transferFacilityOwnership.fulfilled, (state, action) => {
        state.saving = false;
        state.message = action.payload.message || "Ownership transferred";
        if (state.current && action.payload.data?.ownerId) {
          state.current = { ...state.current, owner: action.payload.data.ownerId };
        }
      })
      .addCase(transferFacilityOwnership.rejected, rejected);

    builder
      .addCase(switchFacility.pending, (state) => {
        state.switching = true;
        state.error = null;
      })
      .addCase(switchFacility.fulfilled, (state, action) => {
        state.switching = false;
        state.message = action.payload.message || "Switched facility";
        const d = action.payload.data;
        state.activeFacilityId = d.activeCompanyId || d.companyId;
        const switched = normalizeCompanyTheme(d.activeCompany);
        state.currentTheme = switched;
        if (d.activeCompany) {
          state.activeFacility = d.activeCompany;
        } else if (d.companyId) {
          state.activeFacility = {
            ...(state.activeFacility || { id: d.companyId, name: "Facility", slug: "" }),
            id: d.companyId,
            role: d.role,
          };
        }
      })
      .addCase(switchFacility.rejected, rejected);

    builder
      .addCase(fetchFacilityMembers.pending, (state) => {
        state.membersLoading = true;
        state.error = null;
      })
      .addCase(fetchFacilityMembers.fulfilled, (state, action) => {
        state.membersLoading = false;
        state.members = action.payload.data || [];
      })
      .addCase(fetchFacilityMembers.rejected, rejected);

    builder
      .addCase(fetchFacilityMemberDetail.pending, (state) => {
        state.memberDetailLoading = true;
        state.error = null;
      })
      .addCase(fetchFacilityMemberDetail.fulfilled, (state, action) => {
        state.memberDetailLoading = false;
        state.currentMemberDetail = action.payload.data || null;
      })
      .addCase(fetchFacilityMemberDetail.rejected, rejected);

    builder
      .addCase(addFacilityMember.pending, pending)
      .addCase(addFacilityMember.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || "Member added";
      })
      .addCase(addFacilityMember.rejected, rejected);

    builder
      .addCase(inviteToFacility.pending, pending)
      .addCase(inviteToFacility.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || "Invitation sent";
      })
      .addCase(inviteToFacility.rejected, rejected);

    builder
      .addCase(fetchOutgoingInvites.pending, (state) => {
        state.outgoingInvitesLoading = true;
        state.error = null;
      })
      .addCase(fetchOutgoingInvites.fulfilled, (state, action) => {
        state.outgoingInvitesLoading = false;
        state.outgoingInvites = action.payload.data || [];
      })
      .addCase(fetchOutgoingInvites.rejected, (state, action) => {
        state.outgoingInvitesLoading = false;
        state.error = (action.payload as string) || "Failed to load invitations";
      });

    builder
      .addCase(resendFacilityInvite.pending, pending)
      .addCase(resendFacilityInvite.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || "Invitation resent";
      })
      .addCase(resendFacilityInvite.rejected, rejected);

    builder
      .addCase(retractFacilityInvite.pending, pending)
      .addCase(retractFacilityInvite.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || "Invitation retracted";
        const id = action.payload.inviteId;
        const email =
          action.payload.email ||
          (action.payload.data as { email?: string } | undefined)?.email;
        state.outgoingInvites = state.outgoingInvites.filter((inv) => {
          if (id && inv.id === id) return false;
          if (email && inv.email === email) return false;
          return true;
        });
      })
      .addCase(retractFacilityInvite.rejected, rejected);

    builder
      .addCase(fetchPendingInvites.pending, pending)
      .addCase(fetchPendingInvites.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingInvites = action.payload.data || [];
      })
      .addCase(fetchPendingInvites.rejected, rejected);

    builder
      .addCase(acceptInvite.pending, pending)
      .addCase(acceptInvite.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || "Invitation accepted";
      })
      .addCase(acceptInvite.rejected, rejected);

    builder
      .addCase(rejectInvite.pending, pending)
      .addCase(rejectInvite.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || "Invitation declined";
      })
      .addCase(rejectInvite.rejected, rejected);

    builder
      .addCase(updateFacilityMember.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateFacilityMember.fulfilled, (state, action) => {
        state.saving = false;
        state.message = action.payload.message || "Member updated";
        const mid = action.payload.memberId;
        const d = action.payload.data;
        if (d && mid) {
          state.members = state.members.map((m) =>
            m.id === mid
              ? { ...m, role: d.role, roles: d.roles, department: d.department }
              : m,
          );
          if (state.currentMemberDetail && state.currentMemberDetail.id === mid) {
            state.currentMemberDetail = {
              ...state.currentMemberDetail,
              role: d.role,
              roles: d.roles,
              department: d.department,
            };
          }
        }
      })
      .addCase(updateFacilityMember.rejected, rejected);

    builder
      .addCase(removeFacilityMember.fulfilled, (state, action) => {
        state.members = state.members.filter((m) => m.id !== action.payload.memberId);
        if (state.currentMemberDetail?.id === action.payload.memberId) {
          state.currentMemberDetail = null;
        }
        state.message = action.payload.message || "Member removed";
      })
      .addCase(removeFacilityMember.rejected, rejected);

    builder
      .addCase(leaveFacility.fulfilled, (state, action) => {
        state.message = action.payload.message || "Left facility";
        state.list = state.list.filter((m) => {
          const id =
            typeof m.company === "string"
              ? m.company
              : m.company?._id || (m.company as Facility)?.id;
          return String(id) !== String(action.payload.facilityId);
        });
        if (state.activeFacilityId === action.payload.facilityId) {
          state.activeFacilityId = action.payload.data?.activeCompanyId ?? null;
          state.activeFacility = null;
          state.currentTheme = null;
        }
      })
      .addCase(leaveFacility.rejected, rejected);
  },
});

export const {
  clearFacilitiesError,
  clearCurrentMemberDetail,
  setActiveFacilityFromLogin,
  patchFacilityTheme,
} = facilitiesSlice.actions;
export default facilitiesSlice.reducer;