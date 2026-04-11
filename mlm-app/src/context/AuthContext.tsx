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
  role: string | null;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  isLoggedIn: boolean;
  role: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload, sessionToken: string) => Promise<void>;
  logout: () => Promise<void>;
  userName?: string | null;
}

export const AuthContext = createContext<UseAuthReturn | null>(null);

/** Decode JWT payload segment (no library needed). */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

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
  const role = user?.role ?? null;

  const handleAuthSuccess = useCallback(
    (data: { user: { id: string; phone: string; status: string }; access_token: string; refresh_token: string }) => {
      setTokens(data.access_token, data.refresh_token);

      // Decode JWT to extract role
      const payload = decodeJwtPayload(data.access_token);
      const authUser: AuthUser = {
        ...data.user,
        role: (payload.role as string) ?? null,
      };

      localStorage.setItem('auth_user', JSON.stringify(authUser));
      setUser(authUser);
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
    const refreshToken = localStorage.getItem('hadi_refresh_token');
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
    <AuthContext.Provider value={{ user, isLoggedIn, role, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): UseAuthReturn {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
