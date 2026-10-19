// src/components/NoFarmOnboardingGuard.tsx
// -----------------------------------------------------------------------------
// TASK-072-FE-11 (DEC-362) — guard global "contratante sem fazenda".
//
// Envolve o `<Outlet/>` do bloco privado DENTRO do `DashboardLayout` (sidebar
// e header seguem visíveis → menu da conta acessível). Quando
// `shouldRedirectNoFarm(...)` é true, devolve `<Navigate replace>` para a
// listagem de Fazendas ANTES de renderizar `children` — o conteúdo da rota
// bloqueada nunca monta (sem flash). `replace` não empilha histórico; o destino
// está na allowlist (sem loop). Durante `loading`/sem `profile`/sem
// `farm_context` não decide (fail-open).
// -----------------------------------------------------------------------------

import type { ReactNode } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

import { shouldRedirectNoFarm } from '@/utils/noFarmGuard';

import {
  NO_FARM_NOTICE_STATE_KEY,
  NO_FARM_REDIRECT_TARGET,
} from '@/constants/routes/no-farm-allowed-routes';

interface NoFarmOnboardingGuardProps {
  children: ReactNode;
}

export function NoFarmOnboardingGuard({ children }: NoFarmOnboardingGuardProps) {
  const { loading, profile, roles } = useAuth();
  const { pathname } = useLocation();

  if (shouldRedirectNoFarm({ loading, profile, roles, pathname })) {
    return (
      <Navigate to={NO_FARM_REDIRECT_TARGET} replace state={{ [NO_FARM_NOTICE_STATE_KEY]: true }} />
    );
  }

  return <>{children}</>;
}
