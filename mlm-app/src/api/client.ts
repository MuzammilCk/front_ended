// src/api/client.ts
// Central HTTP client for hadi-perfumes-api.
// All API calls in the app must go through apiRequest().
// Never import fetch() directly in components or pages.

type ViteEnv = { VITE_API_BASE_URL?: string };

const BASE_URL: string =
  (import.meta as { env?: ViteEnv }).env?.VITE_API_BASE_URL ??
  'http://localhost:3000';

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function getUserFirstName(): string | null {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const fullName: string = payload.full_name || payload.name || '';
    return fullName.trim().split(' ')[0] || null;
  } catch {
    return null;
  }
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// ─── Token refresh ───────────────────────────────────────────────────────────

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

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
  }
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
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  // Single retry after token refresh on 401
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers });
    }
  }

  if (!res.ok) {
    const errorBody = await res.text();
    throw new ApiError(res.status, errorBody);
  }

  // Handle 204 No Content and other empty responses
  const text = await res.text();
  return (text.length > 0 ? (JSON.parse(text) as T) : null) as T;
}

