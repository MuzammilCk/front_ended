import { useContext, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext, type UseAuthReturn } from '../context/AuthContext';
import { getAccessToken, clearTokens, getUserFirstName } from '../api/client';
import { logout as apiLogout } from '../api/auth';

export function useAuth(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');

  const navigate = useNavigate();
  const location = useLocation(); // import from react-router-dom

  // Re-derive on every navigation so the navbar always reflects real token state.
  const isLoggedIn = getAccessToken() !== null;
  const [userName] = useState<string | null>(() => getUserFirstName());

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await apiLogout(refreshToken);
      } catch {
        clearTokens();
      }
    } else {
      clearTokens();
    }
    navigate('/login');
  }, [navigate]);

  // Suppress unused variable warning — location is used to trigger re-render on nav
  void location;

  return { ...ctx, isLoggedIn, logout, userName };
}
