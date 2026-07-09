// src/api/auth.ts
// Auth service module — OTP onboarding flow + token management.
// Endpoints: POST /auth/otp/send, /auth/otp/verify, /auth/signup,
//            /auth/refresh, /auth/logout, /auth/login, GET /me/onboarding-status

import { apiRequest, setTokens, clearTokens } from './client';
import type {
  OtpVerifyResponse,
  SignupResponse,
  AuthTokens,
  OnboardingStatus,
  MeProfile,
} from './types';

// ─── OTP Send ───────────────────────────────────────────────────────────────

export interface SendOtpPayload {
  phone: string; // E.164 format: +[country][number]
}

export async function sendOtp(payload: SendOtpPayload): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── OTP Verify ──────────────────────────────────────────────────────────────

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<OtpVerifyResponse> {
  return apiRequest<OtpVerifyResponse>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Signup ──────────────────────────────────────────────────────────────────

export interface SignupPayload {
  full_name: string;
  password: string;
  email?: string;
  referral_code?: string;
  attempt_id?: string;
}

export async function signup(
  payload: SignupPayload,
  sessionToken: string,
): Promise<SignupResponse> {
  const response = await apiRequest<SignupResponse>('/auth/signup', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}` },
    body: JSON.stringify(payload),
  });
  setTokens(response.access_token, response.refresh_token);
  return response;
}

// ─── Refresh ─────────────────────────────────────────────────────────────────

export async function refreshToken(refreshTokenValue: string): Promise<AuthTokens> {
  const response = await apiRequest<AuthTokens>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshTokenValue }),
  });
  setTokens(response.access_token, response.refresh_token);
  return response;
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logout(refreshTokenValue: string): Promise<{ success: boolean }> {
  const response = await apiRequest<{ success: boolean }>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshTokenValue }),
  });
  clearTokens();
  return response;
}

// ─── Login (password-based) ──────────────────────────────────────────────────

export interface LoginPayload {
  identifier: string; // E.164 phone OR email
  password: string;
}

export interface LoginResponse {
  user: { id: string; phone: string; email: string | null; status: string };
  access_token: string;
  refresh_token: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setTokens(response.access_token, response.refresh_token);
  return response;
}

// ─── Login (Google SSO) ──────────────────────────────────────────────────────

export async function googleLogin(credential: string): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
  setTokens(response.access_token, response.refresh_token);
  return response;
}

// ─── Me / Onboarding Status ──────────────────────────────────────────────────

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  return apiRequest<OnboardingStatus>('/me/onboarding-status', {
    method: 'GET',
  });
}

export async function getMe(): Promise<MeProfile> {
  return apiRequest<MeProfile>('/me', {
    method: 'GET',
  });
}

export async function updateMe(payload: { full_name?: string; email?: string }): Promise<MeProfile> {
  return apiRequest<MeProfile>('/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
