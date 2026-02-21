import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { ReactNode } from 'react';

interface DecodedToken {
  userId: string;
  role: 'ADMIN' | 'WAREHOUSE' | 'SUPPORT';
  email: string;
  exp: number;
}

interface ProtectedRouteProps {
  allowedRoles?: ('ADMIN' | 'WAREHOUSE' | 'SUPPORT')[];
  children?: ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const token = sessionStorage.getItem('kaiu_admin_token');

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Check expiration
    if (decoded.exp * 1000 < Date.now()) {
      sessionStorage.removeItem('kaiu_admin_token');
      sessionStorage.removeItem('kaiu_admin_user');
      return <Navigate to="/admin/login" replace />;
    }

    // Check Role
    if (allowedRoles && !allowedRoles.includes(decoded.role)) {
       // Si no tiene permisos, lo devolvemos al inicio del dashboard.
       // (El DashboardLayout se encarga de mostrarle lo que sí puede ver)
       return <Navigate to="/dashboard" replace />;
    }

    // Role is allowed and token valid, render nested routes or children
    return children ? <>{children}</> : <Outlet context={{ user: decoded }} />;
    
  } catch (error) {
    // Invalid token
    sessionStorage.removeItem('kaiu_admin_token');
    return <Navigate to="/admin/login" replace />;
  }
}

