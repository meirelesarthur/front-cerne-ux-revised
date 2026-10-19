// src/pages/Operacional/Reproducao/EstacaoDeMonta/useEstacoesDeMonta.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo ESTAÇÃO DE MONTA (BreedingSeason) — mesmo padrão
// de `Administrativo/Faltas/useAbsences.tsx`:
//   - useEstacoesDeMontaList → useCustomGridQuery (listagem paginada REAL de
//     servidor + filtro opcional `user_uuid`, Tarefa 12)
//   - useEstacaoDeMontaDetail → useQuery direto por uuid (tela de Detalhe,
//     leitura pura, mirror `useEarningDetail`)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';

import {
  getBreedingSeason,
  listBreedingSeasons,
} from '@/services/v2/BreedingSeasons/breeding-season-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  BreedingSeasonDetail,
  BreedingSeasonFilterForm,
  BreedingSeasonListItem,
} from '@/@types/v2/BreedingSeasons';

interface UseEstacoesDeMontaListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: BreedingSeasonFilterForm;
}

// Query de listagem paginada de estações de monta (filtro `user_uuid` vai
// como query param — ver `ListBreedingSeasonsParams`). Paginação REAL de
// servidor — mesmo shape de `useAbsencesList`.
export function useEstacoesDeMontaList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseEstacoesDeMontaListProps) {
  return useCustomGridQuery<BreedingSeasonListItem, BreedingSeasonFilterForm>({
    asyncFunction: listBreedingSeasons,
    queryKey: queryKey.breedingSeasons.breedingSeasonsList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as BreedingSeasonFilterForm),
  });
}

// Leitura pura para a tela de Detalhe — `days`/`weeks` vêm do servidor
// (`GAP-EM-05` do backend, fonte única), nunca recalculados no cliente aqui
// (a prévia client-side só existe no formulário, Tarefa 13). Mirror
// `useEarningDetail`.
export function useEstacaoDeMontaDetail(breedingSeasonUuid?: string) {
  const hasValidUuid = isValidGuid(breedingSeasonUuid ?? null);

  return useQuery({
    queryKey: [queryKey.breedingSeasons.breedingSeason, breedingSeasonUuid],
    queryFn: async () => {
      const response = await getBreedingSeason(breedingSeasonUuid as string);
      return response.data as BreedingSeasonDetail;
    },
    enabled: hasValidUuid,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
