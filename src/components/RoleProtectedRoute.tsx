import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'manager' | 'user' | 'cashier';

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: AppRole[];
}

export function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  const { role, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}