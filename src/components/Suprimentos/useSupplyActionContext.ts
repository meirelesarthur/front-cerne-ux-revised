// src/components/Suprimentos/useSupplyActionContext.ts
// -----------------------------------------------------------------------------
// Monta o contexto das regras de ação (`supplyActionRules`) a partir do usuário
// logado e das permissões. Hook fino: a lógica vive nas funções puras.
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

import type { SupplyActionContext } from './supplyActionRules';

export function useSupplyActionContext(options?: {
  assumeResponsible?: boolean;
}): SupplyActionContext {
  const { user } = useAuth();
  const { can } = usePermissions();
  const assumeResponsible = options?.assumeResponsible;

  return useMemo(
    () => ({ userUuid: user?.uuid ?? null, can, assumeResponsible }),
    [user?.uuid, can, assumeResponsible]
  );
}
