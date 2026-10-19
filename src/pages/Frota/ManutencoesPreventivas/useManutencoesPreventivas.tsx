// src/pages/Frota/ManutencoesPreventivas/useManutencoesPreventivas.tsx
// -----------------------------------------------------------------------------
// Hooks de leitura/exclusão do módulo Manutenções Preventivas
// (MaintenancePreventive) — Tarefa 43 (fundação). Mirror
// `Frota/Abastecimentos/useAbastecimentos.tsx`:
//   - useMaintenancePreventivesGridQuery → useCustomGridQuery (listagem
//     paginada + filtro, SEM ID pai, mirror `get_pwa_grid_query_pattern`
//     Hook 1)
//   - useDeleteMaintenancePreventiveMutation → useRequest com
//     `typesRequest:'apply'` (V3 NÃO tem `useDeleted` — mirror
//     `get_pwa_mutation_query_pattern` §"Substituição V3")
//   - useMaintenancePreventiveDetailQuery → useCustomFormQueryByGuid (GET
//     /maintenance-preventives/{uuid}, compartilhado pela Visualização —
//     Tarefa 43 — e pela hidratação da Edição — Tarefa 44 — já que o
//     contrato não expõe `GET .../edit`)
//
// Os hooks de mutação de CRIAÇÃO/EDIÇÃO (Tarefa 44) vivem dentro de
// `CreateOrUpdateManutencaoPreventiva.tsx` (arquivo próprio dessa Tarefa,
// mirror o wrapper `tryPersistSupply`/`supplyMutation` inline de
// `CreateOrUpdateAbastecimento.tsx` — não neste arquivo, para não colidir).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import {
  deleteMaintenancePreventive,
  getMaintenancePreventiveByUuid,
  listMaintenancePreventives,
} from '@/services/v2/MaintenancePreventives/maintenance-preventive-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  MaintenancePreventiveDetail,
  MaintenancePreventiveFilterForm,
  MaintenancePreventiveListItem,
} from '@/@types/v2/MaintenancePreventives';

interface UseMaintenancePreventivesGridQueryProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: MaintenancePreventiveFilterForm;
}

export function useMaintenancePreventivesGridQuery({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseMaintenancePreventivesGridQueryProps) {
  return useCustomGridQuery<MaintenancePreventiveListItem, MaintenancePreventiveFilterForm>({
    asyncFunction: listMaintenancePreventives,
    queryKey: queryKey.maintenancePreventives.maintenancePreventives,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as MaintenancePreventiveFilterForm),
  });
}

interface UseDeleteMaintenancePreventiveMutationProps {
  actionSuccess: () => void;
}

export function useDeleteMaintenancePreventiveMutation({
  actionSuccess,
}: UseDeleteMaintenancePreventiveMutationProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.maintenancePreventives.maintenancePreventive;

  return useRequest({
    asyncFunction: async ({ maintenancePreventiveUuid }: { maintenancePreventiveUuid: string }) => {
      await deleteMaintenancePreventive(maintenancePreventiveUuid);
      return undefined;
    },
    queryKey: queryKey.maintenancePreventives.maintenancePreventives,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess,
  });
}

interface UseMaintenancePreventiveDetailQueryProps {
  registrationId?: string;
  fillForm: (data: MaintenancePreventiveDetail, resetForce?: boolean) => void;
}

// Hook compartilhado — Visualização (Tarefa 43, `fillForm: () => undefined`)
// e hidratação da Edição (Tarefa 44, `fillForm` real com `reset`), ambos
// reusando `GET /maintenance-preventives/{uuid}` (contrato: "sem RT-EDIT
// dedicada").
export function useMaintenancePreventiveDetailQuery({
  registrationId,
  fillForm,
}: UseMaintenancePreventiveDetailQueryProps) {
  return useCustomFormQueryByGuid<MaintenancePreventiveDetail>({
    registrationId,
    queryKey: queryKey.maintenancePreventives.maintenancePreventive,
    asyncFunction: getMaintenancePreventiveByUuid,
    fillForm,
  });
}
