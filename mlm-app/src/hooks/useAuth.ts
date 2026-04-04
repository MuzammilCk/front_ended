// src/hooks/useAuth.ts
// Auth state hook — reads token from localStorage, provides logout helper.
// This is a synchronous read. No API call is made here.
// For async user profile data, use getOnboardingStatus() from src/api/auth.ts.

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccessToken, clearTokens } from '../api/client';
import { logout as apiLogout } from '../api/auth';

export interface UseAuthReturn {
  isLoggedIn: boolean;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  // Synchronous read of localStorage — no effect needed.
  const [isLoggedIn] = useState<boolean>(() => getAccessToken() !== null);
  const navigate = useNavigate();

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      // Best-effort backend logout — do not block UI on failure.
      try {
        await apiLogout(refreshToken);
      } catch {
        // Backend call failed — still clear tokens locally.
        clearTokens();
      }
    } else {
      clearTokens();
    }
    navigate('/login');
  }, [navigate]);

  return { isLoggedIn, logout };
}
