// src/components/RequireRole.tsx
// Guard de rota por PAPEL (Spatie role) — espelho de `RequirePermission`.
//
// EXCEÇÃO deliberada à convenção "100% permissão" do front (ver cabeçalho de
// `usePermissions.ts`): o Visualizador de Logs (execução 079, DD-079-05) é
// regra de negócio modelada por papel no backend (`hasRole('Gestor_Plataf')`
// além da permissão `system-logs_view`). Usar APENAS onde o backend também
// decide por papel; não generalizar.
//
// Uso (sempre ADITIVO à permissão, nunca no lugar dela):
//   <RequireRole role="Gestor_Plataf">
//     <RequirePermission permission="system-logs_view">{lazyRoute(Page)}</RequirePermission>
//   </RequireRole>
//
// UX apenas: o enforcement real é o 403 do backend.

import type { ReactNode } from 'react';

import { AccessDenied } from '@/components/AccessDenied';

import { usePermissions } from '@/hooks/usePermissions';

interface RequireRoleProps {
  // Papel exigido (ex.: "Gestor_Plataf").
  role: string;
  children: ReactNode;
}

export function RequireRole({ role, children }: RequireRoleProps) {
  const { hasRole } = usePermissions();

  if (!hasRole(role)) return <AccessDenied />;

  return <>{children}</>;
}
