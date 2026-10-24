import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import api, {
  clearTokens,
  getErrorMessage,
  setTokens,
  type ApiSuccess,
} from "../services";
import { API_CONFIG } from "../config";
import type {
  AuthTokens,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  ResetPasswordPayload,
  SignupPayload,
  User,
  UserRole,
  VerifyEmailPayload,
  VerifyResetOtpPayload,
} from "../types";
import {
  updateFacilityMember,
  switchFacility,
  leaveFacility,
} from "./facilitiesSlice";
import {
  adminUpdateUser,
  fetchMe,
  updateMe,
  uploadProfilePicture,
} from "./usersSlice";

/* ── state ─────────────────────────────────────────────────── */
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  /** after verify-email */
  otpSent: boolean;
  otpExpiresInMinutes: number | null;
  /** after verify-reset-otp */
  resetToken: string | null;
  message: string | null;
  /** Last / active facility from login */
  activeFacilityId: string | null;
  activeFacility: import("../types").ActiveFacilityDetails | null;
  pendingInvites: import("../types").PendingInvite[];
  canCreateCompany: boolean;
}

function loadUserFromStorage(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(API_CONFIG.USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function loadToken(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

/** Persist user object to localStorage (and keep auth.user in sync). */
function persistUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(API_CONFIG.USER_KEY);
  }
}

function userIdOf(u: User | null | undefined): string | null {
  if (!u) return null;
  return u._id || u.id || null;
}

function companyIdOf(c: string | { _id?: string; id?: string } | undefined | null): string {
  if (!c) return "";
  if (typeof c === "string") return c;
  return c._id || c.id || "";
}

/**
 * Apply role / department changes for one facility onto the auth user object.
 * Updates companies[], activeCompanyDetails, and top-level role/roles when relevant.
 */
function applyFacilityRoleToUser(
  user: User,
  facilityId: string,
  patch: {
    role?: UserRole;
    roles?: UserRole[];
    department?: string;
  },
): User {
  const next: User = { ...user };

  if (Array.isArray(user.companies)) {
    next.companies = user.companies.map((c) => {
      const cid = companyIdOf(c.company);
      if (cid && String(cid) === String(facilityId)) {
        return {
          ...c,
          role: patch.role ?? c.role,
          roles: patch.roles ?? c.roles,
          department: patch.department !== undefined ? patch.department : c.department,
        };
      }
      return c;
    });
  }

  const activeId =
    (user.activeCompany ? String(user.activeCompany) : null) ||
    user.activeCompanyDetails?.id ||
    null;

  if (activeId && String(activeId) === String(facilityId)) {
    next.activeCompanyDetails = {
      ...(user.activeCompanyDetails || {
        id: facilityId,
        name: "Facility",
        slug: "",
      }),
      role: patch.role ?? user.activeCompanyDetails?.role,
      roles: patch.roles ?? user.activeCompanyDetails?.roles,
      department:
        patch.department !== undefined
          ? patch.department
          : user.activeCompanyDetails?.department,
    };
    // Keep legacy top-level role in sync with the active facility
    if (patch.role !== undefined) next.role = patch.role;
    if (patch.roles !== undefined) next.roles = patch.roles;
    if (patch.department !== undefined) next.department = patch.department;
  }

  return next;
}

const initialState: AuthState = {
  user: loadUserFromStorage(),
  accessToken: loadToken(API_CONFIG.ACCESS_TOKEN_KEY),
  refreshToken: loadToken(API_CONFIG.REFRESH_TOKEN_KEY),
  loading: false,
  error: null,
  otpSent: false,
  otpExpiresInMinutes: null,
  resetToken: null,
  message: null,
  activeFacilityId: null,
  activeFacility: null,
  pendingInvites: [],
  canCreateCompany: true,
};

/* ── thunks (match Express /auth routes) ───────────────────── */

/** POST /auth/verify-email */
export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async (payload: VerifyEmailPayload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<ApiSuccess<{ expiresInMinutes: number }>>(
        "/auth/verify-email",
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not send verification code"));
    }
  },
);

/** POST /auth/signup */
export const signup = createAsyncThunk(
  "auth/signup",
  async (payload: SignupPayload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<ApiSuccess<User>>("/auth/signup", payload);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Signup failed"));
    }
  },
);

/** POST /auth/login */
export const login = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<ApiSuccess<LoginResponse>>("/auth/login", payload);
      const result = data.data;
      setTokens(result.accessToken, result.refreshToken);
      if (typeof window !== "undefined") {
        localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(result.user));
      }
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Invalid email or password"));
    }
  },
);

/** POST /auth/refresh */
export const refreshSession = createAsyncThunk(
  "auth/refresh",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const refreshToken =
        state.auth.refreshToken || loadToken(API_CONFIG.REFRESH_TOKEN_KEY);
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await api.post<ApiSuccess<AuthTokens>>("/auth/refresh", {
        refreshToken,
      });
      setTokens(data.data.accessToken, data.data.refreshToken);
      return data;
    } catch (err) {
      clearTokens();
      return rejectWithValue(getErrorMessage(err, "Session expired"));
    }
  },
);

/** POST /auth/logout */
export const logout = createAsyncThunk("auth/logout", async (_, { getState }) => {
  const state = getState() as { auth: AuthState };
  const refreshToken =
    state.auth.refreshToken || loadToken(API_CONFIG.REFRESH_TOKEN_KEY);
  try {
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken });
    }
  } catch {
    /* ignore */
  }
  clearTokens();
});

/** POST /auth/forgot-password */
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (payload: ForgotPasswordPayload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<ApiSuccess<{ expiresInMinutes: number }>>(
        "/auth/forgot-password",
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not send reset code"));
    }
  },
);

/** POST /auth/verify-reset-otp */
export const verifyResetOtp = createAsyncThunk(
  "auth/verifyResetOtp",
  async (payload: VerifyResetOtpPayload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<
        ApiSuccess<{ resetToken: string; expiresIn: number }>
      >("/auth/verify-reset-otp", payload);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Invalid or expired code"));
    }
  },
);

/** POST /auth/reset-password */
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (payload: ResetPasswordPayload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<ApiSuccess>("/auth/reset-password", payload);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Password reset failed"));
    }
  },
);

/* ── slice ─────────────────────────────────────────────────── */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
      state.message = null;
    },
    clearOtpState(state) {
      state.otpSent = false;
      state.otpExpiresInMinutes = null;
      state.resetToken = null;
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      persistUser(action.payload);
    },
    /**
     * Patch the current user's role(s) for a facility (and activeFacility if it matches).
     * Use when UI already knows the new role without going through updateFacilityMember.
     */
    patchCurrentUserFacilityRole(
      state,
      action: PayloadAction<{
        facilityId: string;
        role?: UserRole;
        roles?: UserRole[];
        department?: string;
      }>,
    ) {
      if (!state.user) return;
      const { facilityId, role, roles, department } = action.payload;
      state.user = applyFacilityRoleToUser(state.user, facilityId, {
        role,
        roles,
        department,
      });
      persistUser(state.user);

      if (
        state.activeFacilityId &&
        String(state.activeFacilityId) === String(facilityId) &&
        state.activeFacility
      ) {
        state.activeFacility = {
          ...state.activeFacility,
          role: role ?? state.activeFacility.role,
          roles: roles ?? state.activeFacility.roles,
          department:
            department !== undefined ? department : state.activeFacility.department,
        };
      }
    },
  },
  extraReducers: (builder) => {
    const pending = (state: AuthState) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    };
    const rejected = (state: AuthState, action: { payload: unknown }) => {
      state.loading = false;
      state.error = (action.payload as string) || "Request failed";
    };

    // verify-email
    builder
      .addCase(verifyEmail.pending, pending)
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.otpExpiresInMinutes = action.payload.data?.expiresInMinutes ?? 15;
        state.message = action.payload.message ?? "Verification code sent";
      })
      .addCase(verifyEmail.rejected, rejected);

    // signup
    builder
      .addCase(signup.pending, pending)
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.data;
        state.otpSent = false;
        state.message = action.payload.message ?? "Account created";
        persistUser(action.payload.data);
      })
      .addCase(signup.rejected, rejected);

    // login
    builder
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        const d = action.payload.data;
        state.user = d.user;
        state.accessToken = d.accessToken;
        state.refreshToken = d.refreshToken;
        state.message = action.payload.message ?? "Login successful";
        state.activeFacilityId =
          d.companyId ??
          d.activeCompany?.id ??
          (d.user?.activeCompany ? String(d.user.activeCompany) : null) ??
          null;
        state.activeFacility = d.activeCompany ?? d.user?.activeCompanyDetails ?? null;
        state.pendingInvites = d.pendingInvites ?? [];
        state.canCreateCompany = d.canCreateCompany ?? true;
        persistUser(d.user);
      })
      .addCase(login.rejected, rejected);

    // refresh
    builder
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.accessToken = action.payload.data.accessToken;
        state.refreshToken = action.payload.data.refreshToken;
      })
      .addCase(refreshSession.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      });

    // logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
      state.message = null;
      state.otpSent = false;
      state.resetToken = null;
      state.activeFacilityId = null;
      state.activeFacility = null;
      state.pendingInvites = [];
    });

    // forgot-password
    builder
      .addCase(forgotPassword.pending, pending)
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.otpExpiresInMinutes = action.payload.data?.expiresInMinutes ?? 15;
        state.message = action.payload.message ?? "If an account exists, a code was sent";
      })
      .addCase(forgotPassword.rejected, rejected);

    // verify-reset-otp
    builder
      .addCase(verifyResetOtp.pending, pending)
      .addCase(verifyResetOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.resetToken = action.payload.data.resetToken;
        state.message = action.payload.message ?? "Code verified";
      })
      .addCase(verifyResetOtp.rejected, rejected);

    // reset-password
    builder
      .addCase(resetPassword.pending, pending)
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.resetToken = null;
        state.otpSent = false;
        state.message = action.payload.message ?? "Password reset successful";
      })
      .addCase(resetPassword.rejected, rejected);

    /* ── keep auth.user in sync when role / profile changes elsewhere ── */

    // Facility / My Persons: update member role → if it's the logged-in user, refresh auth.user
    builder.addCase(updateFacilityMember.fulfilled, (state, action) => {
      const mid = action.payload.memberId;
      const d = action.payload.data;
      if (!d || !mid || !state.user) return;

      const currentId = userIdOf(state.user);
      const updatedId = d.userId || mid;
      if (!currentId || String(currentId) !== String(updatedId)) return;

      // Prefer facilityId from the original thunk arg
      const facilityId =
        (action.meta?.arg as { facilityId?: string } | undefined)?.facilityId ||
        state.activeFacilityId ||
        (state.user.activeCompany ? String(state.user.activeCompany) : null) ||
        state.user.activeCompanyDetails?.id ||
        "";

      if (facilityId) {
        state.user = applyFacilityRoleToUser(state.user, facilityId, {
          role: d.role,
          roles: d.roles,
          department: d.department,
        });
      } else {
        // Fallback: still update top-level role fields
        state.user = {
          ...state.user,
          role: d.role ?? state.user.role,
          roles: d.roles ?? state.user.roles,
          department: d.department !== undefined ? d.department : state.user.department,
        };
      }

      if (
        state.activeFacility &&
        facilityId &&
        String(state.activeFacilityId) === String(facilityId)
      ) {
        state.activeFacility = {
          ...state.activeFacility,
          role: d.role ?? state.activeFacility.role,
          roles: d.roles ?? state.activeFacility.roles,
          department:
            d.department !== undefined ? d.department : state.activeFacility.department,
        };
      }

      persistUser(state.user);
    });

    // Admin PATCH /users/:id — if editing self, replace auth.user
    builder.addCase(adminUpdateUser.fulfilled, (state, action) => {
      const updated = action.payload.data;
      if (!updated || !state.user) return;
      const currentId = userIdOf(state.user);
      const updatedId = updated._id || updated.id;
      if (!currentId || !updatedId || String(currentId) !== String(updatedId)) return;

      state.user = { ...state.user, ...updated };
      persistUser(state.user);
    });

    // Profile self-updates
    builder.addCase(updateMe.fulfilled, (state, action) => {
      if (!action.payload.data) return;
      state.user = action.payload.data;
      persistUser(state.user);
    });

    builder.addCase(uploadProfilePicture.fulfilled, (state, action) => {
      if (!action.payload.data) return;
      state.user = action.payload.data;
      persistUser(state.user);
    });

    builder.addCase(fetchMe.fulfilled, (state, action) => {
      if (!action.payload.data) return;
      state.user = action.payload.data;
      persistUser(state.user);
      if (action.payload.data.activeCompanyDetails) {
        state.activeFacility = action.payload.data.activeCompanyDetails;
        state.activeFacilityId = action.payload.data.activeCompanyDetails.id;
      } else if (action.payload.data.activeCompany) {
        state.activeFacilityId = String(action.payload.data.activeCompany);
      }
    });

    // Switch facility → tokens + role on active facility / user
    builder.addCase(switchFacility.fulfilled, (state, action) => {
      const d = action.payload.data;
      if (!d) return;

      if (d.accessToken) {
        state.accessToken = d.accessToken;
      }

      state.activeFacilityId = d.activeCompanyId || d.companyId || null;
      if (d.activeCompany) {
        state.activeFacility = d.activeCompany;
      } else if (d.companyId) {
        state.activeFacility = {
          ...(state.activeFacility || { id: d.companyId, name: "Facility", slug: "" }),
          id: d.companyId,
          role: d.role,
          roles: d.roles,
        };
      }

      if (state.user) {
        const facilityId = state.activeFacilityId || d.companyId || "";
        state.user = {
          ...state.user,
          activeCompany: facilityId || state.user.activeCompany,
          activeCompanyDetails: state.activeFacility || state.user.activeCompanyDetails,
          role: d.role ?? state.user.role,
          roles: d.roles ?? state.user.roles,
        };
        if (facilityId) {
          state.user = applyFacilityRoleToUser(state.user, facilityId, {
            role: d.role,
            roles: d.roles,
          });
        }
        persistUser(state.user);
      }
    });

    // Leave facility — clear active if it was that one
    builder.addCase(leaveFacility.fulfilled, (state, action) => {
      const leftId = action.payload.facilityId;
      if (state.activeFacilityId && String(state.activeFacilityId) === String(leftId)) {
        state.activeFacilityId = action.payload.data?.activeCompanyId ?? null;
        state.activeFacility = null;
      }
      if (state.user?.companies) {
        state.user = {
          ...state.user,
          companies: state.user.companies.filter(
            (c) => String(companyIdOf(c.company)) !== String(leftId),
          ),
          activeCompany:
            action.payload.data?.activeCompanyId ??
            (state.user.activeCompany &&
            String(state.user.activeCompany) === String(leftId)
              ? undefined
              : state.user.activeCompany),
          activeCompanyDetails:
            state.user.activeCompanyDetails?.id &&
            String(state.user.activeCompanyDetails.id) === String(leftId)
              ? undefined
              : state.user.activeCompanyDetails,
        };
        persistUser(state.user);
      }
    });
  },
});

export const { clearAuthError, clearOtpState, setUser, patchCurrentUserFacilityRole } =
  authSlice.actions;
export default authSlice.reducer;
