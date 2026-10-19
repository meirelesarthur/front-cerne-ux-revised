// src/pages/CadastrosBase/CausaMortePerda/useDeathLosses.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de CAUSA MORTE/PERDA — mesmo padrão de
// Racas/useBreeds.tsx (CRUD-por-GUID + paginação real):
//   - useDeathLossesList → useCustomGridQuery (listagem, SEM ID de contexto)
//   - useDeathLossForm   → useCustomFormQueryByGuid (detalhe p/ formulário)
//
// SEM consumidor de filtro nesta rodada (decisão de fidelidade ao legado, ver
// `DeathLoss-contrato.md §16`) — o `filter` é repassado vazio, mesmo racional
// de `useIdentificationTypesList`.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getDeathLossByUuid, listDeathLosses } from '@/services/v2/DeathLosses/death-loss-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  DeathLossData,
  DeathLossFilterForm,
  DeathLossListItem,
} from '@/@types/v2/DeathLosses';

// Shape efetivamente enviado a `/death-losses` — sem consumidor de filtro
// nesta rodada (ver cabeçalho).
export interface DeathLossListRequestFilter {
  search?: string;
  is_enabled?: '' | 'true' | 'false';
  specie_uuid?: string;
  cause?: string;
}

interface UseDeathLossesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: DeathLossFilterForm;
}

// Query de listagem de causas de morte/perda (SEM ID de contexto —
// `useCustomGridQuery`). Paginação REAL (mirror `useBreedsList`).
export function useDeathLossesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseDeathLossesListProps) {
  return useCustomGridQuery<DeathLossListItem, DeathLossListRequestFilter>({
    asyncFunction: listDeathLosses,
    queryKey: queryKey.deathLosses.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as DeathLossListRequestFilter),
  });
}

interface UseDeathLossFormProps {
  registrationId?: string;
  fillForm: (data: DeathLossData, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID) —
// mirror `useBreedForm`.
export function useDeathLossForm({ registrationId, fillForm }: UseDeathLossFormProps) {
  return useCustomFormQueryByGuid<DeathLossData>({
    registrationId,
    queryKey: queryKey.deathLosses.detail,
    asyncFunction: getDeathLossByUuid,
    fillForm,
  });
}
