// src/pages/Operacional/FeedlotYards/useFeedlotYards.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de PÁTIOS (FeedlotYard) — mesmo padrão de
// CadastrosBase/CentroCusto/useCostCenters.tsx (sibling estrutural PRIMÁRIO
// desta fatia):
//   - useFeedlotYardsList → useCustomGridQuery (listagem paginada + filtros,
//     SEM ID de contexto — não há pai)
//   - useFeedlotYardForm  → useCustomFormQueryByGuid (detalhe p/ formulário
//     de edição E para a tela de Detalhe somente-leitura, TASK-PT-FE-01/02)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getFeedlotYard, listFeedlotYards } from '@/services/v2/FeedlotYards/feedlot-yard-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  FeedlotYardDetail,
  FeedlotYardFilterRequest,
  FeedlotYardListItem,
} from '@/@types/v2/FeedlotYards';

interface UseFeedlotYardsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: FeedlotYardFilterRequest;
}

// Query de listagem paginada de pátios (filtros `code`/`name`/`is_active` vão
// como query params — ver ListFeedlotYardsParams). Família SEM ID de
// contexto (`useCustomGridQuery`) — não há entidade pai.
export function useFeedlotYardsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseFeedlotYardsListProps) {
  return useCustomGridQuery<FeedlotYardListItem, FeedlotYardFilterRequest>({
    asyncFunction: listFeedlotYards,
    queryKey: queryKey.feedlotYards.feedlotYards,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as FeedlotYardFilterRequest),
  });
}

interface UseFeedlotYardFormProps {
  registrationId?: string;
  fillForm: (data: FeedlotYardDetail, resetForce?: boolean) => void;
}

// Query de detalhe — consumida tanto pelo formulário de edição
// (TASK-PT-FE-02) quanto pela tela de Detalhe somente-leitura
// (TASK-PT-FE-01, `fillForm` no-op nesse segundo caso, mesmo racional de
// `DetalheCentroCusto.tsx`).
export function useFeedlotYardForm({ registrationId, fillForm }: UseFeedlotYardFormProps) {
  return useCustomFormQueryByGuid<FeedlotYardDetail>({
    registrationId,
    queryKey: queryKey.feedlotYards.feedlotYard,
    asyncFunction: getFeedlotYard,
    fillForm,
  });
}
