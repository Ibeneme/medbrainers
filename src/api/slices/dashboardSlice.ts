import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";
import type {
  DashboardAlerts,
  DashboardCapacity,
  DashboardDepartments,
  DashboardOverview,
  DashboardTrends,
} from "../types";

export type DashboardSection =
  | "overview"
  | "trends"
  | "capacity"
  | "departments"
  | "alerts";

export interface DashboardState {
  overview: DashboardOverview | null;
  trends: DashboardTrends | null;
  capacity: DashboardCapacity | null;
  departments: DashboardDepartments | null;
  alerts: DashboardAlerts | null;
  loading: Record<DashboardSection, boolean>;
  errors: Record<DashboardSection, string | null>;
  /** ISO time of the last successful response for any section. */
  lastUpdated: string | null;
  /** Facility the cached data belongs to, so a facility switch never shows stale numbers. */
  facilityId: string | null;
}

const sections: DashboardSection[] = ["overview", "trends", "capacity", "departments", "alerts"];
const flags = <T,>(v: T) => Object.fromEntries(sections.map((s) => [s, v])) as Record<DashboardSection, T>;

const initialState: DashboardState = {
  overview: null,
  trends: null,
  capacity: null,
  departments: null,
  alerts: null,
  loading: flags(false),
  errors: flags<string | null>(null),
  lastUpdated: null,
  facilityId: null,
};

/** The facility's timezone is not stored, so use the viewer's — it decides where "today" starts. */
function browserTz(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

type Args = { facilityId: string };

function makeThunk<T>(
  section: DashboardSection,
  failMessage: string,
  extra?: (args: any) => Record<string, unknown>,
) {
  return createAsyncThunk<
    { facilityId: string; data: T },
    Args & Record<string, any>,
    { rejectValue: string }
  >(`dashboard/${section}`, async (args, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<T>>(
        `/companies/${args.facilityId}/dashboard/${section}`,
        { params: { tz: browserTz(), ...(extra ? extra(args) : {}) } },
      );
      return { facilityId: args.facilityId, data: data.data };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, failMessage));
    }
  });
}

export const fetchDashboardOverview = makeThunk<DashboardOverview>("overview", "Could not load overview");
export const fetchDashboardTrends = makeThunk<DashboardTrends>(
  "trends",
  "Could not load trends",
  (a: { days?: number }) => ({ days: a.days }),
);
export const fetchDashboardCapacity = makeThunk<DashboardCapacity>("capacity", "Could not load capacity");
export const fetchDashboardDepartments = makeThunk<DashboardDepartments>(
  "departments",
  "Could not load departments",
);
export const fetchDashboardAlerts = makeThunk<DashboardAlerts>("alerts", "Could not load alerts");

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboard() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    const wire = (
      thunk:
        | typeof fetchDashboardOverview
        | typeof fetchDashboardTrends
        | typeof fetchDashboardCapacity
        | typeof fetchDashboardDepartments
        | typeof fetchDashboardAlerts,
      section: DashboardSection,
    ) => {
      builder
        .addCase(thunk.pending, (s, a) => {
          // Switching facility: drop everything cached for the old one.
          if (s.facilityId && s.facilityId !== a.meta.arg.facilityId) {
            Object.assign(s, { ...initialState, loading: s.loading });
          }
          s.facilityId = a.meta.arg.facilityId;
          s.loading[section] = true;
          s.errors[section] = null;
        })
        .addCase(thunk.fulfilled, (s, a) => {
          s.loading[section] = false;
          // Ignore a late response for a facility the user already left.
          if (a.payload.facilityId !== s.facilityId) return;
          (s as any)[section] = a.payload.data;
          s.lastUpdated = new Date().toISOString();
        })
        .addCase(thunk.rejected, (s, a) => {
          s.loading[section] = false;
          s.errors[section] = (a.payload as string) || "Request failed";
        });
    };
    wire(fetchDashboardOverview, "overview");
    wire(fetchDashboardTrends, "trends");
    wire(fetchDashboardCapacity, "capacity");
    wire(fetchDashboardDepartments, "departments");
    wire(fetchDashboardAlerts, "alerts");
  },
});

export const { clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
