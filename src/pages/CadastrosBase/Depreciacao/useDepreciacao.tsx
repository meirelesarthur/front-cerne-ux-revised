// src/pages/CadastrosBase/Depreciacao/useDepreciacao.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de DEPRECIAÇÃO (Depreciation — Cadastros Base /
// Bens-Ativos, execução 027) — mesmo padrão de CentroCusto/useCostCenters.tsx
// / Funcoes/useFunctions.tsx:
//   - useDepreciationEquipmentList → useCustomGridQuery (listagem paginada
//     REAL de servidor, aba Equipamento, filtros `equipment_uuid`/`year`/
//     `month`)
//   - useDepreciationAnimalList    → useCustomGridQuery (idem, aba Animal,
//     filtros `year`/`month` — `animal_uuid` fora de escopo, §8.2 do
//     contrato de tela)
//   - useGenerateDepreciation      → useRequest (mutação de geração, botão
//     "Gerar" fora das abas — invalida SEMPRE as 2 listagens, independente
//     do `type` pedido, mirror da regra "toda grid relacionada precisa
//     estar na invalidação")
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import {
  generateDepreciation,
  listDepreciationAnimals,
  listDepreciations,
} from '@/services/v2/Depreciations/depreciation-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  DepreciationAnimalFilterForm,
  DepreciationAnimalListItem,
  DepreciationEquipmentListItem,
  DepreciationFilterForm,
  DepreciationGeneratePayload,
  DepreciationGenerateResult,
} from '@/@types/v2/Depreciations';

interface UseDepreciationEquipmentListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: DepreciationFilterForm;
}

// Query de listagem paginada da aba Equipamento (filtros `equipment_uuid`/
// `year`/`month` vão como query params — ver ListDepreciationsParams).
export function useDepreciationEquipmentList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseDepreciationEquipmentListProps) {
  return useCustomGridQuery<DepreciationEquipmentListItem, DepreciationFilterForm>({
    asyncFunction: listDepreciations,
    queryKey: queryKey.depreciations.depreciationEquipmentList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as DepreciationFilterForm),
  });
}

interface UseDepreciationAnimalListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: DepreciationAnimalFilterForm;
}

// Query de listagem paginada da aba Animal (filtros `year`/`month` — sem
// `animal_uuid`, `[A CONFIRMAR — depende da frente Rebanho]`, §8.2 do
// contrato de tela).
export function useDepreciationAnimalList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseDepreciationAnimalListProps) {
  return useCustomGridQuery<DepreciationAnimalListItem, DepreciationAnimalFilterForm>({
    asyncFunction: listDepreciationAnimals,
    queryKey: queryKey.depreciations.depreciationAnimalList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as DepreciationAnimalFilterForm),
  });
}

interface UseGenerateDepreciationProps {
  onSuccess: () => void;
}

// Mutação de geração (`POST /depreciations/generate`) — botão "Gerar" único,
// fora das abas (§2/§9 do contrato de tela), gated `depreciations_create`
// no consumidor. Invalida SEMPRE as 2 queryKeys de listagem, independente
// do `type` pedido no payload (equipment/animal/all).
export function useGenerateDepreciation({ onSuccess }: UseGenerateDepreciationProps) {
  const { languageGB } = useLanguage();

  return useRequest<DepreciationGenerateResult>({
    asyncFunction: (payload: DepreciationGeneratePayload) => generateDepreciation(payload),
    typesRequest: 'apply',
    entityName: languageGB.depreciations.depreciation.singularLabel,
    personalizedMessage: languageGB.depreciations.generateModal.successToast,
    // Nada gerado (0 equipamento + 0 animal) NÃO é sucesso: aviso em vez do toast verde.
    resolveSuccessToast: (result) =>
      result && result.equipment_generated + result.animal_generated === 0
        ? { type: 'warning', description: languageGB.depreciations.generateModal.noEligibleToast }
        : undefined,
    queryKey: queryKey.depreciations.depreciationEquipmentList,
    queryKey2: queryKey.depreciations.depreciationAnimalList,
    actionSuccess: onSuccess,
  });
}
