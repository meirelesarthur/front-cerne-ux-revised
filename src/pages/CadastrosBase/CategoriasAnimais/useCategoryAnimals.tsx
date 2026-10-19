// src/pages/CadastrosBase/CategoriasAnimais/useCategoryAnimals.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de CATEGORIAS ANIMAIS — mesmo padrão de
// Racas/useBreeds.tsx / Produtos/Classes/useKinds.tsx (CRUD-por-GUID):
//   - useCategoryAnimalsList → useCustomGridQuery (listagem, SEM ID de contexto)
//   - useCategoryAnimalForm  → useCustomFormQueryByGuid (detalhe p/ formulário,
//     TASK-FE-542/543)
//
// `CategoryAnimalFilterForm.specie_uuid` é um filtro SERVER-SIDE (decisão do
// Maestro sobre GAP-FE-150) — o `filter` repassado ao `useCustomGridQuery`
// aqui inclui `specie_uuid`/`gender` junto com `search`/`is_enabled`, indo
// direto na querystring real de `GET /category-animals`.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getCategoryAnimalByUuid,
  listCategoryAnimals,
} from '@/services/v2/CategoryAnimals/category-animal-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  CategoryAnimalData,
  CategoryAnimalFilterForm,
  CategoryAnimalGender,
  CategoryAnimalListItem,
} from '@/@types/v2/CategoryAnimals';

// Shape efetivamente enviado a `/category-animals` — inclui `specie_uuid`/
// `gender` (server-side).
export interface CategoryAnimalListRequestFilter {
  search?: string;
  is_enabled?: '' | 'true' | 'false';
  specie_uuid?: string;
  gender?: CategoryAnimalGender | '';
}

interface UseCategoryAnimalsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: CategoryAnimalFilterForm;
}

// Query de listagem de categorias animais (SEM ID de contexto —
// `useCustomGridQuery`). `specie_uuid`/`gender` do filtro são repassados ao
// request (server-side — ver cabeçalho).
export function useCategoryAnimalsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseCategoryAnimalsListProps) {
  const requestFilter: CategoryAnimalListRequestFilter = {
    search: filter?.search,
    is_enabled: filter?.is_enabled,
    specie_uuid: filter?.specie_uuid,
    gender: filter?.gender,
  };

  return useCustomGridQuery<CategoryAnimalListItem, CategoryAnimalListRequestFilter>({
    asyncFunction: listCategoryAnimals,
    queryKey: queryKey.categoryAnimals.categoryAnimalsList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });
}

interface UseCategoryAnimalFormProps {
  registrationId?: string;
  fillForm: (data: CategoryAnimalData, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID) —
// consumida por `TASK-FE-542`/`543`.
export function useCategoryAnimalForm({ registrationId, fillForm }: UseCategoryAnimalFormProps) {
  return useCustomFormQueryByGuid<CategoryAnimalData>({
    registrationId,
    queryKey: queryKey.categoryAnimals.categoryAnimal,
    asyncFunction: getCategoryAnimalByUuid,
    fillForm,
  });
}
