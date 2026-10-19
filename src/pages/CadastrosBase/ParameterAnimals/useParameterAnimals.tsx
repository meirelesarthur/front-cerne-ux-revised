// src/pages/CadastrosBase/ParameterAnimals/useParameterAnimals.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de PARÂMETROS ANIMAIS (ParameterAnimal) — mesmo
// padrão de CadastrosBase/Atividades/useActivities.tsx (TASK-FE-1078/1079,
// regeneração — molde estrutural indicado pela Tarefa):
//   - useParameterAnimalsList → useCustomGridQuery (listagem paginada REAL de
//     servidor, filtro único `search` — TASK-FE-1084, renomeado de
//     `description` para casar com o parâmetro real da API —, sem ID de
//     contexto).
//   - useParameterAnimalForm  → useCustomFormQueryByGuid (detalhe p/
//     formulário) — mirror EXATO de `useFunctionForm`/`useActivityForm`
//     (variante GUID, padrão dominante real do projeto para forms create/edit
//     por UUID; `registrationId` é opcional, casa com
//     `isEditing ? parameterAnimalId : undefined` de
//     `CreateOrUpdateParameterAnimal/index.tsx`).
//
// TASK-FE-1083: `parameter-animal-service.ts` foi corrigido na origem
// (`getParameterAnimals` devolve `ResponsePagination<ParameterAnimalData[]>`
// de verdade, adaptando o envelope cru do backend igual a
// `listCategoryAnimals`/`listFunctions`) — o adaptador local que existia
// aqui só para contornar o tipo/parâmetro errado do service foi REMOVIDO;
// `useParameterAnimalsList` consome `getParameterAnimals` direto, mesmo
// padrão de `useCategoryAnimals.tsx`/`useFunctions.tsx`.
// TASK-FE-1084: o filtro passou a aceitar `search` no TOPO do objeto de
// params (era `description` — chave que a API ignorava silenciosamente).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getParameterAnimalById,
  getParameterAnimals,
} from '@/services/v2/ParameterAnimals/parameter-animal-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  ParameterAnimalData,
  ParameterAnimalFilterForm,
} from '@/@types/v2/ParameterAnimals/parameter-animal';

interface UseParameterAnimalsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: ParameterAnimalFilterForm;
}

// Query de listagem paginada de Parâmetros Animais (filtro único `search`
// vai como query param real — contrato v1.1 §3, sem outro filtro no index).
// `useCustomGridQuery` (família Grid padrão do projeto), SEM ID de contexto.
export function useParameterAnimalsList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseParameterAnimalsListProps) {
  return useCustomGridQuery<ParameterAnimalData, ParameterAnimalFilterForm>({
    asyncFunction: getParameterAnimals,
    queryKey: queryKey.parameterAnimals.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as ParameterAnimalFilterForm),
  });
}

interface UseParameterAnimalFormProps {
  registrationId?: string;
  fillForm: (data: ParameterAnimalData, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID) —
// mesmo padrão de `useFunctionForm`/`useActivityForm`. `getParameterAnimalById`
// devolve `Response<ParameterAnimalData>` (envelope singular, `.data` é o
// registro direto) — este SIM bate 1:1 com o shape real do backend, sem
// necessidade de adaptação.
export function useParameterAnimalForm({ registrationId, fillForm }: UseParameterAnimalFormProps) {
  return useCustomFormQueryByGuid<ParameterAnimalData>({
    registrationId,
    queryKey: queryKey.parameterAnimals.detail,
    asyncFunction: getParameterAnimalById,
    fillForm,
  });
}
