// src/pages/Operacional/FeedlotSectors/useFeedlotSectors.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de SETORES (FeedlotSector) — mirror exato
// `FeedlotYards/useFeedlotYards.tsx`:
//   - useFeedlotSectorsList → useCustomGridQuery (listagem paginada + filtros,
//     SEM ID de contexto — a listagem não tem um Pátio fixo como pai);
//   - useFeedlotSectorForm  → useCustomFormQueryByGuid (detalhe p/ formulário
//     de edição E para a tela de Detalhe somente-leitura, TASK-FS-FE-01/02).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getFeedlotSector,
  listFeedlotSectors,
} from '@/services/v2/FeedlotSectors/feedlot-sector-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  FeedlotSectorDetail,
  FeedlotSectorFilterRequest,
  FeedlotSectorListItem,
} from '@/@types/v2/FeedlotSectors';

interface UseFeedlotSectorsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: FeedlotSectorFilterRequest;
}

// Query de listagem paginada de setores (filtros `code`/`name`/
// `feedlot_yard_id`/`is_active` vão como query params). Família SEM ID de
// contexto (`useCustomGridQuery`) — filtrável por QUALQUER Pátio.
export function useFeedlotSectorsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseFeedlotSectorsListProps) {
  return useCustomGridQuery<FeedlotSectorListItem, FeedlotSectorFilterRequest>({
    asyncFunction: listFeedlotSectors,
    queryKey: queryKey.feedlotSectors.feedlotSectors,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as FeedlotSectorFilterRequest),
  });
}

interface UseFeedlotSectorFormProps {
  registrationId?: string;
  fillForm: (data: FeedlotSectorDetail, resetForce?: boolean) => void;
}

// Query de detalhe — consumida tanto pelo formulário de edição
// (TASK-FS-FE-02) quanto pela tela de Detalhe somente-leitura
// (TASK-FS-FE-01, `fillForm` no-op nesse segundo caso).
export function useFeedlotSectorForm({ registrationId, fillForm }: UseFeedlotSectorFormProps) {
  return useCustomFormQueryByGuid<FeedlotSectorDetail>({
    registrationId,
    queryKey: queryKey.feedlotSectors.feedlotSector,
    asyncFunction: getFeedlotSector,
    fillForm,
  });
}
