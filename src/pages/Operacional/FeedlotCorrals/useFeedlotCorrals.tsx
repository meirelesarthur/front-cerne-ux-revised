// src/pages/Operacional/FeedlotCorrals/useFeedlotCorrals.tsx
// -----------------------------------------------------------------------------
// Hook de query da LISTAGEM de CURRAIS (FeedlotCorral) — TASK-043-CUR-T02
// (`02-Tela-Lista-Currais.md`). Mirror exato `FeedlotSectors/useFeedlotSectors.tsx`
// (`useFeedlotSectorsList` → `useCustomGridQuery`, get_pwa_grid_query_pattern
// "Hook 1: sem ID de contexto") — a listagem de Currais não tem um Setor fixo
// como pai (filtrável por QUALQUER Setor, `feedlot_sector_id` é filtro, não
// contexto). Backend ordena `identification DESC` por padrão
// (`FeedlotCorralRepository::listWithFilters`), 10/página — sem `orderBy`
// explícito no request (mesmo racional do mirror).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { listFeedlotCorrals } from '@/services/v2/FeedlotCorrals/feedlot-corral-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { FeedlotCorralFilterRequest, FeedlotCorralListItem } from '@/@types/v2/FeedlotCorrals';

interface UseFeedlotCorralsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: FeedlotCorralFilterRequest;
}

// Query de listagem paginada de currais (filtros `name`/`feedlot_sector_id`/
// `status` vão como query params — mirror `FeedlotCorralFilterData`,
// GB.Cerne.Api; `installation_type`/`coverage` NÃO são filtro suportado pelo
// backend, ver `FilterSideFeedlotCorrals.tsx`). Família SEM ID de contexto.
export function useFeedlotCorralsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseFeedlotCorralsListProps) {
  return useCustomGridQuery<FeedlotCorralListItem, FeedlotCorralFilterRequest>({
    asyncFunction: listFeedlotCorrals,
    queryKey: queryKey.feedlotCorrals.feedlotCorrals,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as FeedlotCorralFilterRequest),
  });
}
