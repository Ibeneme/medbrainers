import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";
import type { QueryUsersParams, UpdateProfilePayload, User } from "../types";

/* ── state ─────────────────────────────────────────────────── */
export interface UsersState {
  me: User | null;
  list: User[];
  selected: User | null;
  meta: { total: number; page: number; limit: number; pages: number } | null;
  loading: boolean;
  error: string | null;
  message: string | null;
}

const initialState: UsersState = {
  me: null,
  list: [],
  selected: null,
  meta: null,
  loading: false,
  error: null,
  message: null,
};

/* ── thunks (match Express /users routes) ──────────────────── */

/** GET /users/me */
export const fetchMe = createAsyncThunk(
  "users/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<User>>("/users/me");
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load profile"));
    }
  },
);

/** PATCH /users/me */
export const updateMe = createAsyncThunk(
  "users/updateMe",
  async (payload: UpdateProfilePayload, { rejectWithValue }) => {
    try {
      const { data } = await api.patch<ApiSuccess<User>>("/users/me", payload);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to update profile"));
    }
  },
);

/** POST /users/me/profile-picture  (multipart) */
export const uploadProfilePicture = createAsyncThunk(
  "users/uploadProfilePicture",
  async (file: File, { rejectWithValue }) => {
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post<ApiSuccess<User>>("/users/me/profile-picture", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to upload image"));
    }
  },
);

/** GET /users */
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (params: QueryUsersParams = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<User[]>>("/users", { params });
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load users"));
    }
  },
);

/** GET /users/:id */
export const fetchUserById = createAsyncThunk(
  "users/fetchUserById",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<User>>(`/users/${id}`);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "User not found"));
    }
  },
);

/** PATCH /users/:id  (admin / super_admin) */
export const adminUpdateUser = createAsyncThunk(
  "users/adminUpdateUser",
  async (
    { id, payload }: { id: string; payload: Record<string, unknown> },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<User>>(`/users/${id}`, payload);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to update user"));
    }
  },
);

/* ── slice ─────────────────────────────────────────────────── */
const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUsersError(state) {
      state.error = null;
      state.message = null;
    },
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state: UsersState) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    };
    const rejected = (state: UsersState, action: { payload: unknown }) => {
      state.loading = false;
      state.error = (action.payload as string) || "Request failed";
    };

    builder
      .addCase(fetchMe.pending, pending)
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.me = action.payload.data;
      })
      .addCase(fetchMe.rejected, rejected);

    builder
      .addCase(updateMe.pending, pending)
      .addCase(updateMe.fulfilled, (state, action) => {
        state.loading = false;
        state.me = action.payload.data;
        state.message = action.payload.message ?? "Profile updated";
      })
      .addCase(updateMe.rejected, rejected);

    builder
      .addCase(uploadProfilePicture.pending, pending)
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.loading = false;
        state.me = action.payload.data;
        state.message = action.payload.message ?? "Profile picture updated";
      })
      .addCase(uploadProfilePicture.rejected, rejected);

    builder
      .addCase(fetchUsers.pending, pending)
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.meta = action.payload.meta ?? null;
      })
      .addCase(fetchUsers.rejected, rejected);

    builder
      .addCase(fetchUserById.pending, pending)
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload.data;
      })
      .addCase(fetchUserById.rejected, rejected);

    builder
      .addCase(adminUpdateUser.pending, pending)
      .addCase(adminUpdateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload.data;
        state.list = state.list.map((u) =>
          u._id === action.payload.data._id ? action.payload.data : u,
        );
        if (state.me?._id === action.payload.data._id) {
          state.me = action.payload.data;
        }
        state.message = action.payload.message ?? "User updated";
      })
      .addCase(adminUpdateUser.rejected, rejected);
  },
});

export const { clearUsersError, clearSelected } = usersSlice.actions;
export default usersSlice.reducer;
