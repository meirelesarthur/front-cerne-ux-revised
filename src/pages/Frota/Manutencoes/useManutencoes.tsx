// src/pages/Frota/Manutencoes/useManutencoes.tsx
// -----------------------------------------------------------------------------
// Hooks de leitura/exclusão do módulo Manutenções (Maintenance, F-103) —
// Tarefa 43 (fundação). Mirror `Frota/Abastecimentos/useAbastecimentos.tsx`:
//   - useMaintenancesGridQuery → useCustomGridQuery (listagem paginada +
//     filtro, SEM ID pai, mirror `get_pwa_grid_query_pattern` Hook 1)
//   - useDeleteMaintenanceMutation → useRequest com `typesRequest:'apply'`
//     (V3 NÃO tem `useDeleted` — mirror `get_pwa_mutation_query_pattern`
//     §"Substituição V3")
//   - useMaintenanceDetailQuery → useCustomFormQueryByGuid (GET
//     /maintenances/{uuid}, compartilhado pela Visualização — Tarefa 43 — e
//     pela hidratação da Edição — Tarefa 44 — já que o contrato não expõe
//     `GET .../edit`)
//
// Os hooks de mutação de CRIAÇÃO/EDIÇÃO (Tarefa 44) e "Gerar Financeiro"
// (Tarefa 45) vivem em arquivo próprio de cada Tarefa
// (`CreateOrUpdateManutencao.tsx`/`GerarFinanceiroManutencao.tsx`) — mirror
// da decisão já tomada em Abastecimentos, para não colidir.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import {
  deleteMaintenance,
  getMaintenanceByUuid,
  listMaintenances,
} from '@/services/v2/Maintenances/maintenance-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  MaintenanceDetail,
  MaintenanceFilterForm,
  MaintenanceListItem,
} from '@/@types/v2/Maintenances';

interface UseMaintenancesGridQueryProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: MaintenanceFilterForm;
}

export function useMaintenancesGridQuery({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseMaintenancesGridQueryProps) {
  return useCustomGridQuery<MaintenanceListItem, MaintenanceFilterForm>({
    asyncFunction: listMaintenances,
    queryKey: queryKey.maintenances.maintenances,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as MaintenanceFilterForm),
  });
}

interface UseDeleteMaintenanceMutationProps {
  actionSuccess: () => void;
}

export function useDeleteMaintenanceMutation({ actionSuccess }: UseDeleteMaintenanceMutationProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.maintenances.maintenance;

  return useRequest({
    asyncFunction: async ({ maintenanceUuid }: { maintenanceUuid: string }) => {
      await deleteMaintenance(maintenanceUuid);
      return undefined;
    },
    queryKey: queryKey.maintenances.maintenances,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess,
  });
}

interface UseMaintenanceDetailQueryProps {
  registrationId?: string;
  fillForm: (data: MaintenanceDetail, resetForce?: boolean) => void;
}

// Hook compartilhado — Visualização (Tarefa 43, `fillForm: () => undefined`)
// e hidratação da Edição (Tarefa 44, `fillForm` real com `reset`), ambos
// reusando `GET /maintenances/{uuid}` (contrato: "sem GET .../edit").
export function useMaintenanceDetailQuery({
  registrationId,
  fillForm,
}: UseMaintenanceDetailQueryProps) {
  return useCustomFormQueryByGuid<MaintenanceDetail>({
    registrationId,
    queryKey: queryKey.maintenances.maintenance,
    asyncFunction: getMaintenanceByUuid,
    fillForm,
  });
}
