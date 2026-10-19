// src/pages/CadastrosBase/Racas/useBreeds.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de RAÇAS — mesmo padrão de
// CentroCusto/useCostCenters.tsx (único CRUD-por-GUID mais recente já migrado
// pelo pipeline formal neste projeto):
//   - useBreedsList → useCustomGridQuery (listagem, SEM ID de contexto)
//   - useBreedForm  → useCustomFormQueryByGuid (detalhe p/ formulário, TASK-BREED-02)
//
// TASK-BREED-FRONT-PAG: `BreedFilterForm.specie_uuid` passou a ser um filtro
// SERVER-SIDE — o `filter` repassado ao `useCustomGridQuery` aqui inclui
// `specie_uuid` junto com `search`/`is_enabled`, indo direto na querystring
// real de `GET /breeds` (a API agora pagina de verdade e aceita
// `specie_uuid` — ver `breed-service.ts`).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getBreedByUuid, listBreeds } from '@/services/v2/Breeds/breed-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { BreedData, BreedFilterForm, BreedListItem } from '@/@types/v2/Breeds/breed';

// Shape efetivamente enviado a `/breeds` — inclui `specie_uuid` (server-side).
export interface BreedListRequestFilter {
  search?: string;
  is_enabled?: '' | 'true' | 'false';
  specie_uuid?: string;
}

interface UseBreedsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: BreedFilterForm;
}

// Query de listagem de raças (SEM ID de contexto — `useCustomGridQuery`).
// `specie_uuid` do filtro é repassado ao request (server-side — ver cabeçalho).
export function useBreedsList({ paginatedQuery, setPaginatedQuery, filter }: UseBreedsListProps) {
  const requestFilter: BreedListRequestFilter = {
    search: filter?.search,
    is_enabled: filter?.is_enabled,
    specie_uuid: filter?.specie_uuid,
  };

  return useCustomGridQuery<BreedListItem, BreedListRequestFilter>({
    asyncFunction: listBreeds,
    queryKey: queryKey.breeds.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });
}

interface UseBreedFormProps {
  registrationId?: string;
  fillForm: (data: BreedData, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID),
// TASK-BREED-02.
export function useBreedForm({ registrationId, fillForm }: UseBreedFormProps) {
  return useCustomFormQueryByGuid<BreedData>({
    registrationId,
    queryKey: queryKey.breeds.detail,
    asyncFunction: getBreedByUuid,
    fillForm,
  });
}
