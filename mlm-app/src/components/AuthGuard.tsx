// src/components/AuthGuard.tsx
// Synchronous route guard — redirects to /login if no access token in localStorage.
// Does not validate the token with the backend (that happens on the first API call
// which will 401 → client.ts auto-refresh → redirect if refresh also fails).

import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getAccessToken } from '../api/client';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
