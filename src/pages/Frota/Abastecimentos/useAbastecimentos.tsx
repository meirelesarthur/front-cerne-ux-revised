// src/pages/Frota/Abastecimentos/useAbastecimentos.tsx
// -----------------------------------------------------------------------------
// Hooks de leitura/exclusão do módulo Abastecimentos (Supply) — Tarefa 40
// (fundação). Mirror `Operacional/Appropriations/useAppropriations.tsx`:
//   - useSuppliesGridQuery → useCustomGridQuery (listagem paginada + filtro,
//     SEM ID pai, mirror `get_pwa_grid_query_pattern` Hook 1)
//   - useDeleteSupplyMutation → useRequest com `typesRequest:'apply'` (V3 NÃO
//     tem `useDeleted` — mirror `get_pwa_mutation_query_pattern`
//     §"Substituição V3")
//   - useSupplyDetailQuery → useCustomFormQueryByGuid (GET /supplies/{uuid},
//     compartilhado pela Visualização — Tarefa 40 — e pela hidratação da
//     Edição — Tarefa 41 — já que o contrato não expõe `GET .../edit`)
//
// Os hooks de mutação de CRIAÇÃO/EDIÇÃO (Tarefa 41) vivem dentro de
// `CreateOrUpdateAbastecimento.tsx` (arquivo próprio dessa Tarefa, mirror o
// wrapper `tryPersistAppropriation`/`appropriationMutation` inline de
// `CreateOrUpdateAppropriation.tsx` — não neste arquivo, para não colidir).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import { deleteSupply, getSupplyByUuid, listSupplies } from '@/services/v2/Supplies/supply-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { SupplyDetail, SupplyFilterForm, SupplyListItem } from '@/@types/v2/Supplies';

interface UseSuppliesGridQueryProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: SupplyFilterForm;
}

export function useSuppliesGridQuery({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseSuppliesGridQueryProps) {
  return useCustomGridQuery<SupplyListItem, SupplyFilterForm>({
    asyncFunction: listSupplies,
    queryKey: queryKey.supplies.supplies,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as SupplyFilterForm),
  });
}

interface UseDeleteSupplyMutationProps {
  actionSuccess: () => void;
}

export function useDeleteSupplyMutation({ actionSuccess }: UseDeleteSupplyMutationProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.supplies.supply;

  return useRequest({
    asyncFunction: async ({ supplyUuid }: { supplyUuid: string }) => {
      await deleteSupply(supplyUuid);
      return undefined;
    },
    queryKey: queryKey.supplies.supplies,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess,
  });
}

interface UseSupplyDetailQueryProps {
  registrationId?: string;
  fillForm: (data: SupplyDetail, resetForce?: boolean) => void;
}

// Hook compartilhado — Visualização (Tarefa 40, `fillForm: () => undefined`)
// e hidratação da Edição (Tarefa 41, `fillForm` real com `reset`), ambos
// reusando `GET /supplies/{uuid}` (contrato §3: "sem `GET .../edit`").
export function useSupplyDetailQuery({ registrationId, fillForm }: UseSupplyDetailQueryProps) {
  return useCustomFormQueryByGuid<SupplyDetail>({
    registrationId,
    queryKey: queryKey.supplies.supply,
    asyncFunction: getSupplyByUuid,
    fillForm,
  });
}
