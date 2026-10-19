// src/pages/Operacional/Reproducao/Acasalamento/useAcasalamentos.tsx
// -----------------------------------------------------------------------------
// Hooks de dados de Acasalamento (BreedingMating — Operacional / Reprodução,
// F-016, 97-Esteiras/001).
//
// ⚠️ Arquivo COMPARTILHADO entre TASK-BM-FE-03 (listagem/filtro/ações,
// `useAcasalamentosList` abaixo) e TASK-BM-FE-04 (contexto do formulário e
// cascatas, hooks no bloco seguinte). Cada Tarefa acrescenta só os hooks do
// seu próprio escopo — nenhuma edita o que a outra já entregou.
//
// Hook de query da LISTAGEM (TASK-BM-FE-03). Mesmo padrão de
// `EstacaoDeMonta/useEstacoesDeMonta.tsx`/`Weaning/useWeanings.tsx`:
// `useCustomGridQuery` (sem ID de contexto) + filtro opcional
// (`user_uuid`/`breeding_batch_uuid`, `EP-BM-01`).
//
// Paginação REAL de servidor (`meta.current_page/last_page/per_page/total`,
// contrato de API §6.1/§8) — `listBreedingMatings` já adapta o envelope
// `ApiResponse::paginated` para `ResponsePagination<T>` (V3, `.items`).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getBreedingMating,
  getBreedingMatingCreateContext,
  getBreedingMatingNextStepContext,
  getBreedingSeasonCascadeContext,
  listBreedingBatchAnimals,
  listBreedingMatings,
} from '@/services/v2/BreedingMating/breeding-mating-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  BreedingMatingFilterRequest,
  BreedingMatingListItem,
} from '@/@types/v2/BreedingMating';

interface UseAcasalamentosListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: BreedingMatingFilterRequest;
}

export function useAcasalamentosList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseAcasalamentosListProps) {
  return useCustomGridQuery<BreedingMatingListItem, BreedingMatingFilterRequest>({
    asyncFunction: listBreedingMatings,
    queryKey: queryKey.breedingMatings.breedingMatingsList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as BreedingMatingFilterRequest),
  });
}

export default useAcasalamentosList;

// =============================================================================
// TASK-BM-FE-04 — contexto do formulário e cascatas (casca, cabeçalho,
// `AcasalamentoHeaderFields.tsx`/`CreateOrUpdateAcasalamento.tsx`).
// =============================================================================

/** `EP-BM-03` — contexto de CRIAÇÃO (`next_code`+`field_matrix`+
 *  `locked_fields`+`lookups`). Nunca chamado em edição — a Tarefa usa
 *  `EP-BM-04` via `useCustomFormQueryByGuid`, dentro do componente (Lei 2:
 *  `fillForm` função nomeada com guarda de `dirtyFields`, get_pwa_form_query_pattern). */
/**
 * Contexto de criação do formulário de Acasalamento (`EP-BM-03`).
 * @param {boolean} enabled - Ativa a query (nunca em modo edição — ver `EP-BM-04`).
 * @return {UseQueryResult} Resultado da query (`next_code`+`field_matrix`+`locked_fields`+`lookups`).
 */
export function useBreedingMatingCreateContext(enabled: boolean) {
  return useQuery({
    queryKey: [queryKey.breedingMatings.breedingMating, 'form-context'],
    queryFn: getBreedingMatingCreateContext,
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/** `EP-BM-12` — cascata C3: `breeding_season_uuid` muda → repovoa
 *  touro/sêmen/embrião, protocolo e lote a partir do MESMO payload (C4/C5,
 *  sem requisição nova por campo — contrato de tela §3.1/§6.3). */
/**
 * Cascata C3 (`EP-BM-12`) — `breeding_season_uuid` muda e repovoa
 * touro/sêmen/embrião, protocolo e lote a partir do mesmo payload.
 * @param {string | undefined} breedingSeasonUuid - Estação de monta selecionada; `undefined` desabilita a query.
 * @return {UseQueryResult} Resultado da query (`BreedingSeasonCascadeContext`).
 */
export function useBreedingSeasonCascade(breedingSeasonUuid: string | undefined) {
  return useQuery({
    queryKey: [
      queryKey.breedingMatings.breedingMating,
      'breeding-season-context',
      breedingSeasonUuid ?? null,
    ],
    queryFn: () => getBreedingSeasonCascadeContext(breedingSeasonUuid!),
    enabled: !!breedingSeasonUuid,
    staleTime: 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/** `EP-BM-11` — cascata C6: `breeding_batch_uuid` muda → repovoa animais
 *  elegíveis do lote (nó `bm-endpoint-breeding-batches-animals`, manifesto
 *  FID-G3F #29). Consumida visualmente por `NaturalSection`/`ProtocolSection`
 *  na TASK-BM-FE-05; esta Tarefa só abre o fio de dados. */
/**
 * Cascata C6 (`EP-BM-11`) — `breeding_batch_uuid` muda e repovoa os animais
 * elegíveis do lote.
 * @param {string | undefined} breedingBatchUuid - Lote de reprodução selecionado; `undefined` desabilita a query.
 * @return {UseQueryResult} Resultado da query (`AnimalOptionRef[]`).
 */
export function useBreedingBatchAnimalsCascade(breedingBatchUuid: string | undefined) {
  return useQuery({
    queryKey: [
      queryKey.breedingMatings.breedingMating,
      'breeding-batch-animals',
      breedingBatchUuid ?? null,
    ],
    queryFn: () => listBreedingBatchAnimals(breedingBatchUuid!),
    enabled: !!breedingBatchUuid,
    staleTime: 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// =============================================================================
// TASK-BM-FE-06 — visualização (`bm-screen-show`) e Próxima Etapa
// (`bm-flow-iatf-next-step`). Dois hooks novos: detalhe (`EP-BM-02`) e
// contexto de próxima etapa (`EP-BM-09`). `isPending && isFetching` (V5) é o
// critério de "carregando" consumido pelas telas (contrato de tela §6.7,
// get_pwa_grid_query_pattern — "isPending vs isLoading").
// =============================================================================

/**
 * Detalhe do Acasalamento (`EP-BM-02`) — os 3 blocos mutuamente exclusivos
 * (`natural`/`simplified`/`protocol`, exatamente um preenchido) + timeline.
 * Consumido por `AcasalamentoDetalhe.tsx` e, para os campos de cabeçalho
 * travados (`code`/`type`/`breeding_batch`), por `AcasalamentoProximaEtapa.tsx`.
 * @param {string | undefined} breedingMatingUuid - uuid da rota; `undefined`/inválido desabilita a query.
 * @return {UseQueryResult} Resultado da query (`BreedingMatingData`).
 */
export function useAcasalamentoDetalhe(breedingMatingUuid: string | undefined) {
  return useQuery({
    queryKey: [queryKey.breedingMatings.breedingMating, 'detail', breedingMatingUuid ?? null],
    queryFn: async () => {
      const response = await getBreedingMating(breedingMatingUuid!);
      return response.data;
    },
    enabled: !!breedingMatingUuid,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Contexto de Próxima Etapa (`EP-BM-09`) — já devolve a próxima
 * identificação e a data (se já for a última, repete a mesma, regra do
 * contrato de tela §6.5); `individual` reflete `?modo=individual` da rota
 * (traduzido para `?mode=individual` na request pelo service, contrato de
 * tela §6.5/regra 12 da Tarefa).
 * @param {string | undefined} breedingMatingUuid - uuid da rota; `undefined`/inválido desabilita a query.
 * @param {boolean} individual - Modo individual (`?modo=individual`).
 * @return {UseQueryResult} Resultado da query (`BreedingMatingNextStepContext`).
 */
export function useAcasalamentoProximaEtapa(
  breedingMatingUuid: string | undefined,
  individual: boolean
) {
  return useQuery({
    queryKey: [
      queryKey.breedingMatings.breedingMating,
      'next-step',
      breedingMatingUuid ?? null,
      individual,
    ],
    queryFn: async () => {
      const response = await getBreedingMatingNextStepContext(breedingMatingUuid!, individual);
      return response.data;
    },
    enabled: !!breedingMatingUuid,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
