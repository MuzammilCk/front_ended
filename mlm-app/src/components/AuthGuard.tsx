import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: string | string[];
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isLoggedIn, role } = useAuth();

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!role || !allowedRoles.includes(role)) {
      return (
        <div className="min-h-screen bg-[#080604] flex items-center justify-center">
          <div className="text-center max-w-sm">
            <p className="font-serif text-3xl font-light text-[#e8dcc8] mb-2">Unauthorized</p>
            <p className="text-[11px] text-muted/40 tracking-wide mb-6">
              You don't have permission to access this page.
            </p>
            <a
              href="/"
              className="text-[10px] tracking-[0.2em] uppercase text-[#c9a96e] border border-[#c9a96e]/25 px-5 py-2.5 hover:bg-[#c9a96e]/8 transition-colors duration-300"
            >
              Go Home
            </a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
