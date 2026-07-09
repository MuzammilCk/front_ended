// src/api/client.ts
// Central HTTP client for hadi-perfumes-api.
// All API calls in the app must go through apiRequest().
// Never import fetch() directly in components or pages.

type ViteEnv = { VITE_API_BASE_URL?: string };

const BASE_URL: string =
  (import.meta as { env?: ViteEnv }).env?.VITE_API_BASE_URL ??
  'http://localhost:3000';

// ─── Token helpers ────────────────────────────────────────────────────────────

const ACCESS_TOKEN_KEY = 'hadi_access_token';
const REFRESH_TOKEN_KEY = 'hadi_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getUserFirstName(): string | null {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const fullName: string = payload.full_name || payload.name || '';
    return fullName.trim().split(' ')[0] || null;
  } catch {
    return null;
  }
}

export function getUserRole(): string | null {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ─── Token refresh ───────────────────────────────────────────────────────────

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

let refreshTokenPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // If a refresh is already in progress, wait for it to finish and reuse its result!
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  // Store the promise in the global variable before executing it
  refreshTokenPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        return null;
      }

      const data = (await res.json()) as RefreshResponse;
      setTokens(data.access_token, data.refresh_token);
      return data.access_token;
    } catch {
      clearTokens();
      return null;
    } finally {
      // CLEAR the Promise once it completes so future token expirations can refresh normally
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
}

// ─── Error class ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly status: number;
  public readonly body: string;

  constructor(status: number, body: string) {
    super(`API error ${status}: ${body}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// ─── Core request function ───────────────────────────────────────────────────

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const token = getAccessToken();

  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  // Single retry after token refresh on 401.
  // IMPORTANT: Skip for /auth/* endpoints — they are unauthenticated flows
  // (OTP verify, login, signup). A 401 from auth endpoints means "bad
  // credentials", NOT "expired session". Intercepting them would destroy
  // the registration form state via a hard redirect.
  const isAuthEndpoint = path.startsWith('/auth/');

  if (res.status === 401 && !isAuthEndpoint) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
    } else {
      // Refresh failed — clear state and redirect
      clearTokens();
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
      // Return a never-resolving promise to prevent callers from
      // processing a stale response while the redirect is in flight
      return new Promise<never>(() => {});
    }
  }

  if (!res.ok) {
    const errorBody = await res.text();
    // Parse NestJS JSON error responses to extract clean messages.
    // NestJS returns { statusCode, message, error } — we only want `message`.
    let cleanMessage = errorBody;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.message) {
        cleanMessage = Array.isArray(parsed.message)
          ? parsed.message.join('. ')
          : parsed.message;
      }
    } catch {
      // Not JSON — use raw text as-is
    }
    throw new ApiError(res.status, cleanMessage);
  }

  // Handle 204 No Content and other empty responses
  const text = await res.text();
  return (text.length > 0 ? (JSON.parse(text) as T) : null) as T;
}
