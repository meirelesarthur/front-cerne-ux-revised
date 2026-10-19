// src/pages/Operacional/Reproducao/BullSeedSeason/useBullSeedSeasons.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo TOUROS/SÊMEN/EMBRIÃO (BullSeedSeason) — mesmo
// padrão de `EstacaoDeMonta/useEstacoesDeMonta.tsx`:
//   - useBullSeedSeasonsList → useCustomGridQuery (listagem paginada REAL de
//     servidor + filtro opcional `start_date`/`end_date`, Tarefa 24)
//   - useBullSeedSeasonDetail → useQuery direto por uuid (tela de Detalhe,
//     leitura pura, mirror `useEstacaoDeMontaDetail`/`useEarningDetail`)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';

import {
  getBullSeedSeason,
  listBullSeedSeasons,
} from '@/services/v2/BullSeedSeason/bull-seed-season-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  BullSeedSeasonDetail,
  BullSeedSeasonFilterRequest,
  BullSeedSeasonListItem,
} from '@/@types/v2/BullSeedSeason';

interface UseBullSeedSeasonsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: BullSeedSeasonFilterRequest;
}

// Query de listagem paginada — filtro `start_date`/`end_date` (contrato de
// tela §4.3, sem busca textual — armadilha 2 da Tarefa 24). Paginação REAL
// de servidor — mesmo shape de `useEstacoesDeMontaList`.
export function useBullSeedSeasonsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseBullSeedSeasonsListProps) {
  return useCustomGridQuery<BullSeedSeasonListItem, BullSeedSeasonFilterRequest>({
    asyncFunction: listBullSeedSeasons,
    queryKey: queryKey.bullSeedSeason.bullSeedSeasonsList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as BullSeedSeasonFilterRequest),
  });
}

// Leitura pura para a tela de Detalhe — `animals`/`products` só existem
// neste Resource (armadilha 3 da Tarefa 24), nunca recalculados/derivados no
// cliente. Mirror `useEstacaoDeMontaDetail`.
export function useBullSeedSeasonDetail(bullSeedSeasonUuid?: string) {
  const hasValidUuid = isValidGuid(bullSeedSeasonUuid ?? null);

  return useQuery({
    queryKey: [queryKey.bullSeedSeason.bullSeedSeason, bullSeedSeasonUuid],
    queryFn: async () => {
      const response = await getBullSeedSeason(bullSeedSeasonUuid as string);
      return response.data as BullSeedSeasonDetail;
    },
    enabled: hasValidUuid,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
