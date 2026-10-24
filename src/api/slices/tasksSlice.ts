import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";
import type {
  CreateHandoverPayload,
  CreateTaskPayload,
  FacilityTask,
  ShiftHandoverLog,
  UpdateTaskPayload,
} from "../types";

export interface TasksState {
  all: FacilityTask[];
  mine: FacilityTask[];
  handovers: ShiftHandoverLog[];
  current: FacilityTask | null;
  currentHandover: ShiftHandoverLog | null;
  allLoading: boolean;
  mineLoading: boolean;
  handoversLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: TasksState = {
  all: [],
  mine: [],
  handovers: [],
  current: null,
  currentHandover: null,
  allLoading: false,
  mineLoading: false,
  handoversLoading: false,
  detailLoading: false,
  saving: false,
  error: null,
  message: null,
};

export const fetchAllTasks = createAsyncThunk(
  "tasks/fetchAll",
  async (
    {
      facilityId,
      status,
      priority,
    }: { facilityId: string; status?: string; priority?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<FacilityTask[]>>(
        `/companies/${facilityId}/tasks`,
        { params: { scope: "all", status, priority } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load tasks"));
    }
  },
);

export const fetchMyTasks = createAsyncThunk(
  "tasks/fetchMine",
  async (
    {
      facilityId,
      status,
      priority,
    }: { facilityId: string; status?: string; priority?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<FacilityTask[]>>(
        `/companies/${facilityId}/tasks/mine`,
        { params: { status, priority } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load your tasks"));
    }
  },
);

export const fetchTaskDetail = createAsyncThunk(
  "tasks/fetchDetail",
  async (
    { facilityId, taskId }: { facilityId: string; taskId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<FacilityTask>>(
        `/companies/${facilityId}/tasks/${taskId}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not load task"));
    }
  },
);

export const fetchHandoverDetail = createAsyncThunk(
  "tasks/fetchHandoverDetail",
  async (
    { facilityId, handoverId }: { facilityId: string; handoverId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<ShiftHandoverLog>>(
        `/companies/${facilityId}/handovers/${handoverId}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not load handover"));
    }
  },
);

export const createTask = createAsyncThunk(
  "tasks/create",
  async (
    { facilityId, payload }: { facilityId: string; payload: CreateTaskPayload },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<FacilityTask>>(
        `/companies/${facilityId}/tasks`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not create task"));
    }
  },
);

export const updateTask = createAsyncThunk(
  "tasks/update",
  async (
    {
      facilityId,
      taskId,
      payload,
    }: { facilityId: string; taskId: string; payload: UpdateTaskPayload },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<FacilityTask>>(
        `/companies/${facilityId}/tasks/${taskId}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update task"));
    }
  },
);

export const deleteTask = createAsyncThunk(
  "tasks/delete",
  async (
    { facilityId, taskId }: { facilityId: string; taskId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.delete<ApiSuccess>(
        `/companies/${facilityId}/tasks/${taskId}`,
      );
      return { ...data, taskId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not delete task"));
    }
  },
);

export const fetchHandovers = createAsyncThunk(
  "tasks/fetchHandovers",
  async (
    {
      facilityId,
      scope,
      from,
      to,
    }: { facilityId: string; scope?: "all" | "mine"; from?: string; to?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<ShiftHandoverLog[]>>(
        `/companies/${facilityId}/handovers`,
        { params: { scope: scope || "all", from, to } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load handovers"));
    }
  },
);

export const createHandover = createAsyncThunk(
  "tasks/createHandover",
  async (
    { facilityId, payload }: { facilityId: string; payload: CreateHandoverPayload },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ShiftHandoverLog>>(
        `/companies/${facilityId}/handovers`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not submit handover"));
    }
  },
);

export const acknowledgeHandover = createAsyncThunk(
  "tasks/acknowledgeHandover",
  async (
    { facilityId, handoverId }: { facilityId: string; handoverId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ShiftHandoverLog>>(
        `/companies/${facilityId}/handovers/${handoverId}/acknowledge`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not acknowledge handover"));
    }
  },
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearTasksError(state) {
      state.error = null;
      state.message = null;
    },
    clearTaskDetail(state) {
      state.current = null;
    },
    clearHandoverDetail(state) {
      state.currentHandover = null;
    },
  },
  extraReducers: (builder) => {
    const rejected = (state: TasksState, action: { payload?: unknown }) => {
      state.saving = false;
      state.allLoading = false;
      state.mineLoading = false;
      state.handoversLoading = false;
      state.error = (action.payload as string) || "Request failed";
    };

    builder
      .addCase(fetchAllTasks.pending, (s) => {
        s.allLoading = true;
        s.error = null;
      })
      .addCase(fetchAllTasks.fulfilled, (s, a) => {
        s.allLoading = false;
        s.all = a.payload.data || [];
      })
      .addCase(fetchAllTasks.rejected, rejected);

    builder
      .addCase(fetchMyTasks.pending, (s) => {
        s.mineLoading = true;
        s.error = null;
      })
      .addCase(fetchMyTasks.fulfilled, (s, a) => {
        s.mineLoading = false;
        s.mine = a.payload.data || [];
      })
      .addCase(fetchMyTasks.rejected, rejected);

    builder
      .addCase(fetchTaskDetail.pending, (s) => {
        s.detailLoading = true;
        s.error = null;
      })
      .addCase(fetchTaskDetail.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.current = a.payload.data || null;
      })
      .addCase(fetchTaskDetail.rejected, (s, a) => {
        s.detailLoading = false;
        s.error = (a.payload as string) || "Failed";
      });

    builder
      .addCase(fetchHandoverDetail.pending, (s) => {
        s.detailLoading = true;
      })
      .addCase(fetchHandoverDetail.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.currentHandover = a.payload.data || null;
      })
      .addCase(fetchHandoverDetail.rejected, (s, a) => {
        s.detailLoading = false;
        s.error = (a.payload as string) || "Failed";
      });

    builder
      .addCase(createTask.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(createTask.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Task created";
        if (a.payload.data) s.all = [a.payload.data, ...s.all];
      })
      .addCase(createTask.rejected, rejected);

    builder
      .addCase(updateTask.pending, (s) => {
        s.saving = true;
      })
      .addCase(updateTask.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Task updated";
        const t = a.payload.data;
        if (!t) return;
        const id = t._id || t.id;
        s.all = s.all.map((x) => ((x._id || x.id) === id ? t : x));
        s.mine = s.mine.map((x) => ((x._id || x.id) === id ? t : x));
        if (s.current && (s.current._id || s.current.id) === id) {
          s.current = t;
        }
      })
      .addCase(updateTask.rejected, rejected);

    builder.addCase(deleteTask.fulfilled, (s, a) => {
      s.all = s.all.filter((x) => (x._id || x.id) !== a.payload.taskId);
      s.mine = s.mine.filter((x) => (x._id || x.id) !== a.payload.taskId);
      s.message = a.payload.message || "Task deleted";
    });

    builder
      .addCase(fetchHandovers.pending, (s) => {
        s.handoversLoading = true;
      })
      .addCase(fetchHandovers.fulfilled, (s, a) => {
        s.handoversLoading = false;
        s.handovers = a.payload.data || [];
      })
      .addCase(fetchHandovers.rejected, rejected);

    builder
      .addCase(createHandover.pending, (s) => {
        s.saving = true;
      })
      .addCase(createHandover.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Handover submitted";
        if (a.payload.data) s.handovers = [a.payload.data, ...s.handovers];
      })
      .addCase(createHandover.rejected, rejected);

    builder.addCase(acknowledgeHandover.fulfilled, (s, a) => {
      const t = a.payload.data;
      if (!t) return;
      const id = t._id || t.id;
      s.handovers = s.handovers.map((h) => ((h._id || h.id) === id ? t : h));
      s.message = a.payload.message || "Handover acknowledged";
    });
  },
});

export const { clearTasksError, clearTaskDetail, clearHandoverDetail } = tasksSlice.actions;
export default tasksSlice.reducer;
