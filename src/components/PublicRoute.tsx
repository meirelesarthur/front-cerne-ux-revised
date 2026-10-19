// src/components/PublicRoute.tsx

import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege rotas públicas (login, registro, etc)
 * Redireciona para /home se o usuário já estiver autenticado
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Se autenticado, redireciona para a página que tentou acessar ou para /home
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || "/home";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
