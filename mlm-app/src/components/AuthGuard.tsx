import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: string | string[];
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isLoggedIn, role, logout } = useAuth();

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!role || !allowedRoles.includes(role)) {
      return (
        <div className="min-h-screen bg-[#080604] flex items-center justify-center relative overflow-hidden">
          {/* Subtle background texture */}
          <div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{ backgroundImage: 'url(/assets/profile-bg.jpg)' }} />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-[#c9a96e]/5 rounded-full pointer-events-none animate-[spin_90s_linear_infinite]" />

          <div className="relative text-center max-w-sm px-6 animate-in fade-in duration-500">
            {/* Lock icon */}
            <div className="w-12 h-12 border border-rose-500/20 bg-rose-500/5 flex items-center justify-center mx-auto mb-6 rounded-sm">
              <span className="text-rose-400 text-lg">⊘</span>
            </div>

            <p className="font-serif text-3xl font-light text-[#e8dcc8] mb-2">Access Restricted</p>
            <p className="font-sans text-sm text-white/50 mb-8 leading-relaxed">
              You don't have permission to view this page. Contact your system administrator if you believe this is an error.
            </p>

            <a
              href="/"
              className="inline-block font-sans text-xs tracking-widest uppercase text-[#c9a96e] border border-[#c9a96e]/25 px-6 py-2.5 hover:bg-[#c9a96e]/8 transition-colors duration-300"
            >
              Go Home
            </a>

            <div className="mt-4">
              <button
                onClick={() => void logout()}
                className="font-sans text-xs text-muted/40 hover:text-white/60 transition-colors duration-200"
              >
                Log out and use a different account →
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
