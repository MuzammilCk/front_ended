import { Navigate } from 'react-router-dom';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem('admin_token');

  if (!token) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
}
