import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";
import { API_CONFIG } from "./config";

/* ── redirection helper ────────────────────────────────────── */
function redirectToLogin() {
  if (typeof window === "undefined") return;
  // Prevent infinite loops if already on the login page
  if (window.location.pathname.includes("/login")) return;

  window.location.href = "/login"; // Change to "/(auth)/login" or your exact router path if needed
}

/* ── token & cookie helpers ────────────────────────────────── */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return Cookies.get(API_CONFIG.ACCESS_TOKEN_KEY) || null;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return Cookies.get(API_CONFIG.REFRESH_TOKEN_KEY) || null;
}

export function setTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  Cookies.set(API_CONFIG.ACCESS_TOKEN_KEY, access, { secure: true, sameSite: "strict" });
  if (refresh) {
    Cookies.set(API_CONFIG.REFRESH_TOKEN_KEY, refresh, { secure: true, sameSite: "strict" });
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  Cookies.remove(API_CONFIG.ACCESS_TOKEN_KEY);
  Cookies.remove(API_CONFIG.REFRESH_TOKEN_KEY);
  Cookies.remove(API_CONFIG.USER_KEY);
  Cookies.remove(API_CONFIG.ACTIVE_FACILITY_KEY);
}

/* ── axios instance ────────────────────────────────────────── */
const api: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* attach access token on every request */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (!token) {
    // Optional: If you want to block requests immediately when there's no access token client-side
    // clearTokens();
    // redirectToLogin();
  } else {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* auto-refresh on 401 once */
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => {
    if (error) p.reject(error);
    else if (token) p.resolve(token);
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || original._retry) {
      if (error.response?.status === 401) {
        clearTokens();
        redirectToLogin();
      }
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      redirectToLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
        refreshToken,
      });
      const newAccess = data?.data?.accessToken as string;
      const newRefresh = data?.data?.refreshToken as string | undefined;
      setTokens(newAccess, newRefresh);
      processQueue(null, newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      clearTokens();
      redirectToLogin();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;

/* ── typed API helpers ─────────────────────────────────────── */
export type ApiSuccess<T = unknown> = {
  success: true;
  message?: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type ApiErrorBody = {
  success?: false;
  message?: string;
  errors?: Array<{ path: string; message: string }>;
  lockedUntil?: string;
  retryAfterSeconds?: number;
};

export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.message) return body.message;
    if (body?.errors?.length) return body.errors.map((e) => e.message).join(", ");
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}