// src/components/RequirePermission.tsx
// Guard de rota por permissão (RBAC Spatie, nomes `recurso_acao`).
//
// Uso em rota real (página implementada):
//   <Route path="/cadastros-base/fazendas" element={
//     <RequirePermission permission="farms_view">{lazyRoute(Farms)}</RequirePermission>
//   } />
//
// Para as rotas catch-all de módulo (RoutePlaceholder), o guard equivalente
// já é aplicado automaticamente por pathname — ver RoutePlaceholder em
// ModulePlaceholder.tsx.
//
// UX apenas: o enforcement real é o 403 do backend.

import type { ReactNode } from 'react';

import { AccessDenied } from '@/components/AccessDenied';

import { usePermissions } from '@/hooks/usePermissions';

interface RequirePermissionProps {
  /** Permissão exigida (ex.: "farms_view"). */
  permission?: string;
  /** Alternativa: basta QUALQUER uma destas. */
  anyOf?: string[];
  /**
   * Alternativa: exige TODAS estas (INC-R24, REAUDITORIA-036-2a-rodada) —
   * usado quando a tela combina duas ações do backend com permissões
   * distintas (ex.: edição de Income faz GET sob `incomes_view` e PUT sob
   * `incomes_edit`; `anyOf` deixava passar quem só tinha uma das duas e a
   * tela falhava ao carregar).
   */
  allOf?: string[];
  children: ReactNode;
}

export function RequirePermission({ permission, anyOf, allOf, children }: RequirePermissionProps) {
  const { can, canAny, canAll } = usePermissions();

  const allowed = permission
    ? can(permission)
    : anyOf?.length
      ? canAny(anyOf)
      : allOf?.length
        ? canAll(allOf)
        : true;

  if (!allowed) return <AccessDenied />;

  return <>{children}</>;
}
