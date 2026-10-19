// src/pages/Planos/usePlanRole.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de PLANOS (PlanRole) — mesmo padrão de
// `CadastrosBase/CentroCusto/useCostCenters.tsx`/`useTroughs.tsx`:
//   - usePlanRolesList → useCustomGridQuery (listagem paginada + filtros,
//     TASK-FE-2701)
//   - usePlanRoleForm  → useCustomFormQueryByGuid (detalhe p/ formulário/
//     visualização, TASK-FE-2702/TASK-FE-2703 — hook ÚNICO, reconsumido em
//     modo leitura pela Visualização com `fillForm` no-op, mesmo contrato de
//     `useCostCenterForm`)
//
// `PlanRole` é catálogo GLOBAL (sem `farm_id`/`tenant_id`) — `usePlanRolesList`
// usa `useCustomGridQuery` SEM ID de contexto (mesma armadilha documentada em
// `Configuracoes/Apps/index.tsx`).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getPlanRole, listPlanRoles } from '@/services/v2/Planos/planRole-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { PlanRoleDetail, PlanRoleFilterForm, PlanRoleListItem } from '@/@types/v2/Planos';

interface UsePlanRolesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: PlanRoleFilterForm;
}

// Query de listagem paginada de Planos (filtros `search`/`is_free` vão como
// query params).
export function usePlanRolesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UsePlanRolesListProps) {
  return useCustomGridQuery<PlanRoleListItem, PlanRoleFilterForm>({
    asyncFunction: listPlanRoles,
    queryKey: queryKey.planos.planRoles,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as PlanRoleFilterForm),
  });
}

interface UsePlanRoleFormProps {
  registrationId?: string;
  fillForm: (data: PlanRoleDetail, resetForce?: boolean) => void;
}

// Query de detalhe — consumida pelo formulário (TASK-FE-2702, `fillForm`
// popula o RHF) E pela Visualização (TASK-FE-2703, `fillForm` no-op — o
// hook não é tocado, só o uso diverge).
export function usePlanRoleForm({ registrationId, fillForm }: UsePlanRoleFormProps) {
  return useCustomFormQueryByGuid<PlanRoleDetail>({
    registrationId,
    queryKey: queryKey.planos.planRole,
    asyncFunction: getPlanRole,
    fillForm,
  });
}
