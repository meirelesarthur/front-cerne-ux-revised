// src/pages/CadastrosBase/Operacoes/useOperations.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de OPERAÇÕES (Operation) — mesmo padrão de
// CadastrosBase/Racas/useBreeds.tsx (paginação REAL, default 10):
//   - useOperationList → useCustomGridQuery (listagem, filtro server-side
//     inclui `grouper_uuid`, GAP-FE-006 resolvido)
//   - useOperationForm → useCustomFormQueryByGuid (detalhe p/ formulário)
//
// TASK-FE-041 cobre a fundação de dados (sem UI). As telas que consomem estes
// hooks (listagem/form/roteamento) são TASK-FE-042/043/044.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getNextOperationOrder,
  getOperationByUuid,
  listOperations,
} from '@/services/v2/Operations/operation-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  OperationDetail,
  OperationFilterForm,
  OperationListItem,
  OperationNextOrder,
  OperationUseSlug,
} from '@/@types/v2/Operations';

// Shape efetivamente enviado a `/operations` — inclui `grouper_uuid`
// (server-side, GAP-FE-006 resolvido); `grouper_label` (display-only de
// `OperationFilterForm`) NÃO entra aqui, nunca vai à querystring.
export interface OperationListRequestFilter {
  search?: string;
  is_enabled?: 'true' | 'false';
  use?: OperationUseSlug;
  grouper_uuid?: string;
}

interface UseOperationListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: OperationFilterForm;
}

// Query de listagem de Operações (SEM ID de contexto — `useCustomGridQuery`).
// `grouper_uuid` do filtro é repassado ao request (server-side — ver cabeçalho).
export function useOperationList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseOperationListProps) {
  const requestFilter: OperationListRequestFilter = {
    search: filter?.search,
    is_enabled: filter?.is_enabled,
    use: filter?.use,
    grouper_uuid: filter?.grouper_uuid,
  };

  return useCustomGridQuery<OperationListItem, OperationListRequestFilter>({
    asyncFunction: listOperations,
    queryKey: queryKey.operations.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });
}

interface UseOperationFormProps {
  registrationId?: string;
  fillForm: (data: OperationDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID),
// mesmo padrão de `useBreedForm`/`useActivityForm`.
export function useOperationForm({ registrationId, fillForm }: UseOperationFormProps) {
  return useCustomFormQueryByGuid<OperationDetail>({
    registrationId,
    queryKey: queryKey.operations.detail,
    asyncFunction: getOperationByUuid,
    fillForm,
  });
}

interface UseOperationNextOrderProps {
  enabled: boolean;
}

// Ajuste pós-E2E — backend virou AUTORITATIVO sobre `order` (recalcula no
// create, ignora o valor enviado; preserva no update). Leitura pura da
// PRÓXIMA ordem disponível (`GET /operations/next-order`), só em modo
// CRIAÇÃO (`enabled` controlado pelo chamador = `!isEditing`) — sem
// fillForm/reset de formulário, mesmo racional de `useHarvestCurrentWeek`
// (CadastrosBase/Safra/useHarvests.tsx): `useQuery` direto, nomeado.
export function useOperationNextOrder({ enabled }: UseOperationNextOrderProps) {
  return useQuery<OperationNextOrder>({
    queryKey: [queryKey.operations.nextOrder],
    queryFn: async () => (await getNextOperationOrder()).data,
    enabled,
    refetchOnWindowFocus: false,
  });
}
