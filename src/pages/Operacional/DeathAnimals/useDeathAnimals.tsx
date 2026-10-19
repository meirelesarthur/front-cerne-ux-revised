// src/pages/Operacional/DeathAnimals/useDeathAnimals.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de Mortes (DeathAnimal) — mesmo padrão de
// `Operacional/FeedlotYards/useFeedlotYards.tsx` (sibling estrutural
// PRIMÁRIO):
//   - useDeathAnimalsList → useCustomGridQuery (listagem paginada + filtros,
//     SEM ID de contexto — não há pai)
//   - useDeathAnimalForm  → useCustomFormQueryByGuid (detalhe p/ formulário
//     de edição E para a tela de Detalhe somente-leitura, TASK-DA-FE-01/02)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getDeathAnimal, listDeathAnimals } from '@/services/v2/DeathAnimals/death-animal-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  DeathAnimalDetail,
  DeathAnimalFilterRequest,
  DeathAnimalListItem,
} from '@/@types/v2/DeathAnimals';

interface UseDeathAnimalsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: DeathAnimalFilterRequest;
}

// Query de listagem paginada de mortes (filtros `animal_identification`/
// `cause_uuid`/`start_date`/`end_date` vão como query params). Família SEM ID
// de contexto (`useCustomGridQuery`) — não há entidade pai. Ordenação `code
// desc` é FIXA server-side — este hook nunca envia `orderBy`.
export function useDeathAnimalsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseDeathAnimalsListProps) {
  return useCustomGridQuery<DeathAnimalListItem, DeathAnimalFilterRequest>({
    asyncFunction: listDeathAnimals,
    queryKey: queryKey.deathAnimals.deathAnimals,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as DeathAnimalFilterRequest),
  });
}

interface UseDeathAnimalFormProps {
  registrationId?: string;
  fillForm: (data: DeathAnimalDetail, resetForce?: boolean) => void;
}

// Query de detalhe — consumida tanto pelo formulário de edição
// (TASK-DA-FE-02) quanto pela tela de Detalhe somente-leitura
// (TASK-DA-FE-01, `fillForm` no-op nesse segundo caso, mesmo racional de
// `DetalheFeedlotYard.tsx`).
export function useDeathAnimalForm({ registrationId, fillForm }: UseDeathAnimalFormProps) {
  return useCustomFormQueryByGuid<DeathAnimalDetail>({
    registrationId,
    queryKey: queryKey.deathAnimals.deathAnimal,
    asyncFunction: getDeathAnimal,
    fillForm,
  });
}
