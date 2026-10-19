// src/pages/CadastrosBase/Rebanho/useAnimal.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de REBANHO (Animal) — mesmo padrão de
// `CategoriasAnimais/useCategoryAnimals.tsx`/`Administrativo/Funcoes/
// useFunctions.tsx`:
//   - useAnimalsList → useCustomGridQuery (listagem paginada REAL de servidor
//     + filtros `search`/`category_id`/`batch`, nomes reais de
//     `AnimalIndexRequest::rules()` — corrigido em `GAP-FE-203`, 2026-08-03)
//   - useAnimalForm  → useCustomFormQueryByGuid (detalhe p/ formulário,
//     consumido a partir de TASK-FE-882) — mesma variante dominante em todo
//     `CadastrosBase/*` para forms create/edit por GUID.
//
// `X-Farm-Id` — Animal é farm-scoped (diferente dos catálogos globais
// vizinhos Species/Breed/CategoryAnimal/CategoryMatrix/IdentificationType) —
// propagado pelo interceptor genérico do `api.ts`, nada a fazer aqui.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getAnimalByUuid, listAnimals } from '@/services/v2/Animals/animal-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { AnimalData, AnimalFilterForm, AnimalListItem } from '@/@types/v2/Animals';

interface UseAnimalsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: AnimalFilterForm;
}

// Query de listagem paginada do rebanho (filtros `search`/`category_id`/
// `batch` vão como query params reais — ver `ListAnimalsParams`). Paginação
// REAL de servidor.
export function useAnimalsList({ paginatedQuery, setPaginatedQuery, filter }: UseAnimalsListProps) {
  return useCustomGridQuery<AnimalListItem, AnimalFilterForm>({
    asyncFunction: listAnimals,
    queryKey: queryKey.animals.animalsList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as AnimalFilterForm),
  });
}

interface UseAnimalFormProps {
  registrationId?: string;
  fillForm: (data: AnimalData, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID) —
// consumida a partir de `TASK-FE-882`.
export function useAnimalForm({ registrationId, fillForm }: UseAnimalFormProps) {
  return useCustomFormQueryByGuid<AnimalData>({
    registrationId,
    queryKey: queryKey.animals.animal,
    asyncFunction: getAnimalByUuid,
    fillForm,
  });
}
