import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  login as apiLogin,
  logout as apiLogout,
  type LoginPayload,
  type SignupPayload,
} from '../api/auth';
import { signup as apiSignup } from '../api/auth';
import { clearTokens, getAccessToken, setTokens } from '../api/client';

interface AuthUser {
  id: string;
  phone: string;
  status: string;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  isLoggedIn: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload, sessionToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<UseAuthReturn | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  // Keep isLoggedIn in sync: true only when both token and user are present
  const isLoggedIn = user !== null && getAccessToken() !== null;

  const handleAuthSuccess = useCallback(
    (data: { user: AuthUser; access_token: string; refresh_token: string }) => {
      setTokens(data.access_token, data.refresh_token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setUser(data.user);
    },
    [],
  );

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await apiLogin(payload);
      handleAuthSuccess(data);
    },
    [handleAuthSuccess],
  );

  const signup = useCallback(
    async (payload: SignupPayload, sessionToken: string) => {
      const data = await apiSignup(payload, sessionToken);
      handleAuthSuccess(data);
    },
    [handleAuthSuccess],
  );

  const logout = useCallback(async () => {
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
    localStorage.removeItem('auth_user');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
