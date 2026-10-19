// src/pages/Operacional/Rainfalls/useRainfalls.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de Pluviometria (Rainfall) — mesmo padrão de
// `Operacional/DeathAnimals/useDeathAnimals.tsx`/`FeedlotYards/useFeedlotYards.tsx`
// (siblings estruturais PRIMÁRIOS):
//   - useRainfallsList → useCustomGridQuery (listagem paginada + filtros,
//     SEM ID de contexto — não há pai, tenant vem do header `X-Farm-Id`)
//   - useRainfallForm  → useCustomFormQueryByGuid (detalhe p/ formulário de
//     edição E para a tela de Detalhe somente-leitura)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getAllRainfalls, getRainfall } from '@/services/v2/Rainfalls/rainfall-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  RainfallDetail,
  RainfallFilterRequest,
  RainfallListItem,
} from '@/@types/v2/Rainfalls';

interface UseRainfallsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: RainfallFilterRequest;
}

// Query de listagem paginada de pluviometria (filtros `start_date`/
// `end_date`). Família SEM ID de contexto (`useCustomGridQuery`) — não há
// entidade pai. Ordenação `date desc` é FIXA server-side — este hook nunca
// envia `orderBy`.
export function useRainfallsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseRainfallsListProps) {
  return useCustomGridQuery<RainfallListItem, RainfallFilterRequest>({
    asyncFunction: getAllRainfalls,
    queryKey: queryKey.rainfalls.rainfalls,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as RainfallFilterRequest),
  });
}

interface UseRainfallFormProps {
  registrationId?: string;
  fillForm: (data: RainfallDetail, resetForce?: boolean) => void;
}

// Query de detalhe — consumida tanto pelo formulário de edição quanto pela
// tela de Detalhe somente-leitura (`fillForm` no-op nesse segundo caso,
// mesmo racional de `DetalheDeathAnimal.tsx`).
export function useRainfallForm({ registrationId, fillForm }: UseRainfallFormProps) {
  return useCustomFormQueryByGuid<RainfallDetail>({
    registrationId,
    queryKey: queryKey.rainfalls.rainfall,
    asyncFunction: getRainfall,
    fillForm,
  });
}
