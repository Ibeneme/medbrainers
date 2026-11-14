import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";
import type {
  AccessCatalogModule,
  AccessInfo,
  AccessPayload,
  AccessRole,
  MemberAccess,
} from "../types";
import { login, logout } from "./authSlice";
import { fetchMe } from "./usersSlice";
import { switchFacility } from "./facilitiesSlice";

/**
 * Roles & access control (client side).
 *
 * `byFacility[facilityId]` is the server-computed answer to "what may this person do here?"
 * It arrives with login / users/me / switch-company (`data.access`) and can be refreshed
 * from GET /companies/:id/access/me. The server remains the enforcer; this slice only drives the UI.
 */
export interface AccessState {
  byFacility: Record<string, AccessInfo>;
  /** idle → nothing asked yet · loading · ready (at least one answer) · error */
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  lastFetchedAt: number | null;

  /* admin screens */
  catalog: AccessCatalogModule[];
  roles: AccessRole[];
  rolesLoading: boolean;
  memberAccess: Record<string, MemberAccess>;
  saving: boolean;
}

const initialState: AccessState = {
  byFacility: {},
  status: "idle",
  error: null,
  lastFetchedAt: null,
  catalog: [],
  roles: [],
  rolesLoading: false,
  memberAccess: {},
  saving: false,
};

/* ── thunks ───────────────────────────────────────────────── */

/** GET /companies/:id/access/me */
export const fetchMyAccess = createAsyncThunk(
  "access/fetchMine",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<AccessInfo>>(`/companies/${facilityId}/access/me`);
      return { facilityId, access: data.data };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not load your permissions"));
    }
  },
);

export const fetchAccessCatalog = createAsyncThunk(
  "access/fetchCatalog",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<AccessCatalogModule[]>>(`/companies/${facilityId}/access/catalog`);
      return data.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not load the permission catalog"));
    }
  },
);

export const fetchAccessRoles = createAsyncThunk(
  "access/fetchRoles",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<AccessRole[]>>(`/companies/${facilityId}/access/roles`);
      return data.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not load roles"));
    }
  },
);

export const createAccessRole = createAsyncThunk(
  "access/createRole",
  async (
    p: { facilityId: string; name: string; description?: string; permissions: string[] },
    { rejectWithValue },
  ) => {
    try {
      const { facilityId, ...body } = p;
      const { data } = await api.post<ApiSuccess<AccessRole>>(`/companies/${facilityId}/access/roles`, body);
      return data.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not create the role"));
    }
  },
);

export const updateAccessRole = createAsyncThunk(
  "access/updateRole",
  async (
    p: { facilityId: string; roleId: string; name?: string; description?: string; permissions?: string[] },
    { rejectWithValue },
  ) => {
    try {
      const { facilityId, roleId, ...body } = p;
      const { data } = await api.patch<ApiSuccess<AccessRole>>(`/companies/${facilityId}/access/roles/${roleId}`, body);
      return data.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update the role"));
    }
  },
);

export const resetAccessRole = createAsyncThunk(
  "access/resetRole",
  async (p: { facilityId: string; roleId: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post<ApiSuccess<AccessRole>>(
        `/companies/${p.facilityId}/access/roles/${p.roleId}/reset`,
      );
      return data.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not reset the role"));
    }
  },
);

export const deleteAccessRole = createAsyncThunk(
  "access/deleteRole",
  async (p: { facilityId: string; roleId: string }, { rejectWithValue }) => {
    try {
      await api.delete(`/companies/${p.facilityId}/access/roles/${p.roleId}`);
      return p.roleId;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not delete the role"));
    }
  },
);

export const fetchMemberAccess = createAsyncThunk(
  "access/fetchMember",
  async (p: { facilityId: string; memberId: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<MemberAccess>>(
        `/companies/${p.facilityId}/access/members/${p.memberId}`,
      );
      return data.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not load this person's access"));
    }
  },
);

export const saveMemberAccess = createAsyncThunk(
  "access/saveMember",
  async (
    p: {
      facilityId: string;
      memberId: string;
      roleIds?: string[];
      permissions?: string[];
      deniedPermissions?: string[];
    },
    { rejectWithValue },
  ) => {
    try {
      const { facilityId, memberId, ...body } = p;
      const { data } = await api.put<ApiSuccess<MemberAccess>>(
        `/companies/${facilityId}/access/members/${memberId}`,
        body,
      );
      return data.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not save access"));
    }
  },
);

/* ── helpers ──────────────────────────────────────────────── */

function ingest(state: AccessState, block: AccessPayload | undefined | null) {
  if (!block) return;
  const next = { ...state.byFacility, ...(block.companies || {}) };
  if (block.activeCompanyId && block.active) next[block.activeCompanyId] = block.active;
  state.byFacility = next;
  state.status = "ready";
  state.error = null;
  state.lastFetchedAt = Date.now();
}

const slice = createSlice({
  name: "access",
  initialState,
  reducers: {
    /** Restore the last known access from localStorage so the first paint after a reload isn't empty. */
    hydrateAccess(state, action: PayloadAction<Record<string, AccessInfo>>) {
      if (state.status === "ready") return; // fresh server data already arrived
      state.byFacility = action.payload || {};
    },
    clearAccess() {
      return initialState;
    },
  },
  extraReducers: (b) => {
    // the server includes `access` in these responses
    b.addCase(login.fulfilled, (state, action) => {
      const d: any = action.payload?.data;
      ingest(state, d?.access ?? d?.user?.access);
    });
    b.addCase(fetchMe.fulfilled, (state, action) => {
      ingest(state, (action.payload?.data as any)?.access);
    });
    b.addCase(switchFacility.fulfilled, (state, action) => {
      ingest(state, (action.payload?.data as any)?.access);
    });
    b.addCase(logout.fulfilled, () => initialState);

    b.addCase(fetchMyAccess.pending, (state) => {
      if (state.status !== "ready") state.status = "loading";
    });
    b.addCase(fetchMyAccess.fulfilled, (state, action) => {
      state.byFacility = { ...state.byFacility, [action.payload.facilityId]: action.payload.access };
      state.status = "ready";
      state.error = null;
      state.lastFetchedAt = Date.now();
    });
    b.addCase(fetchMyAccess.rejected, (state, action) => {
      // keep the last known access on a transient failure; only flag error if we have nothing
      if (Object.keys(state.byFacility).length === 0) state.status = "error";
      state.error = (action.payload as string) || "Could not load your permissions";
    });

    b.addCase(fetchAccessCatalog.fulfilled, (state, action) => {
      state.catalog = action.payload;
    });
    b.addCase(fetchAccessRoles.pending, (state) => {
      state.rolesLoading = true;
    });
    b.addCase(fetchAccessRoles.fulfilled, (state, action) => {
      state.rolesLoading = false;
      state.roles = action.payload;
    });
    b.addCase(fetchAccessRoles.rejected, (state, action) => {
      state.rolesLoading = false;
      state.error = (action.payload as string) || null;
    });

    for (const t of [createAccessRole, updateAccessRole, resetAccessRole, deleteAccessRole, saveMemberAccess]) {
      b.addCase(t.pending, (state) => {
        state.saving = true;
      });
      b.addCase(t.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || null;
      });
    }
    b.addCase(createAccessRole.fulfilled, (state, action) => {
      state.saving = false;
      state.roles = [...state.roles, action.payload];
    });
    b.addCase(updateAccessRole.fulfilled, (state, action) => {
      state.saving = false;
      state.roles = state.roles.map((r) => (r.id === action.payload.id ? { ...r, ...action.payload } : r));
    });
    b.addCase(resetAccessRole.fulfilled, (state, action) => {
      state.saving = false;
      state.roles = state.roles.map((r) => (r.id === action.payload.id ? { ...r, ...action.payload } : r));
    });
    b.addCase(deleteAccessRole.fulfilled, (state, action) => {
      state.saving = false;
      state.roles = state.roles.filter((r) => r.id !== action.payload);
    });
    b.addCase(fetchMemberAccess.fulfilled, (state, action) => {
      state.memberAccess[action.payload.userId] = action.payload;
    });
    b.addCase(saveMemberAccess.fulfilled, (state, action) => {
      state.saving = false;
      state.memberAccess[action.payload.userId] = action.payload;
    });
  },
});

export const { hydrateAccess, clearAccess } = slice.actions;
export default slice.reducer;
