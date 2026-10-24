/**
 * API configuration
 * Change BASE_URL for production / staging.
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5009",
  TIMEOUT_MS: 30_000,
  /** localStorage keys */
  ACCESS_TOKEN_KEY: "mb_access_token",
  REFRESH_TOKEN_KEY: "mb_refresh_token",
  USER_KEY: "mb_user",
} as const;

export default API_CONFIG;
