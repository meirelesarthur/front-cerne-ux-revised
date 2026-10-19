// src/components/PrivateRoute.tsx

import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege rotas privadas
 * Redireciona para /login se o usuário não estiver autenticado
 *
 * ERRO-FE-012: enquanto `loading===true` (boot inicial ou qualquer operação
 * de auth em voo), ainda NÃO sabemos se o usuário está autenticado — não
 * decide nada (não redireciona) e deixa o overlay de `<Loading/>` do
 * `AuthProvider` cobrir a tela. Só decide `!isAuthenticated → /login` quando
 * `loading===false`, ou seja, quando a resposta já é definitiva.
 */
export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    // Salva a rota atual para redirecionar após o login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
