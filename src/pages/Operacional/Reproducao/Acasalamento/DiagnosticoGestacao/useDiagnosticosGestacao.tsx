// src/pages/Operacional/Reproducao/Acasalamento/DiagnosticoGestacao/useDiagnosticosGestacao.tsx
// -----------------------------------------------------------------------------
// Hooks de dados de Diagnóstico de Gestação (PregnancyDiagnosis — sub-árvore
// ANINHADA de Acasalamento, F-016, 97-Esteiras/001, TASK-BM-FE-07).
//
// `breedingMatingUuid` é o ID PAI (rota aninhada) — por isso a listagem usa
// `useCustomGridQueryById` (não `useCustomGridQuery` genérico, usado pelo
// Acasalamento em `useAcasalamentos.tsx` por não ter ID pai). O service
// `listPregnancyDiagnoses(breedingMatingUuid, params)` (Tarefa 02) já tem a
// assinatura exata exigida por `asyncFunctionById` (get_pwa_grid_query_pattern
// — árvore de decisão "1 ID pai UUID"), sem wrapper necessário.
//
// O detalhe (`EP-PD-04`) segue o MESMO padrão de `useAcasalamentoDetalhe`
// (`useAcasalamentos.tsx`, TASK-BM-FE-06): `useQuery` direto, chave própria
// com os DOIS uuids (pai + filho), `isPending && isFetching` como critério de
// carga inicial (contrato de tela §6.7).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomGridQueryById } from '@/hooks/useCustomGridQueryById';

import { queryKey } from '@/constants/query-key';

import {
  getPregnancyDiagnosis,
  getPregnancyDiagnosisCreateContext,
  listPregnancyDiagnoses,
} from '@/services/v2/BreedingMating/pregnancy-diagnosis-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  PregnancyDiagnosisFilterRequest,
  PregnancyDiagnosisListItem,
} from '@/@types/v2/BreedingMating/pregnancyDiagnosis';

interface UseDiagnosticosGestacaoListProps {
  breedingMatingUuid: string | undefined;
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: PregnancyDiagnosisFilterRequest;
}

/**
 * Listagem de Diagnóstico de Gestação (`EP-PD-01`), aninhada sob o
 * Acasalamento pai. `breedingMatingUuid` vem por prop (regra 4 da Tarefa —
 * já resolvido por `useParams` no componente de rota, `index.tsx`), nunca
 * lido de novo aqui.
 * @param {UseDiagnosticosGestacaoListProps} params - uuid do Acasalamento pai + estado de paginação/filtro.
 * @return {UseQueryResult} Resultado da query paginada (`PregnancyDiagnosisListItem[]`).
 */
export function useDiagnosticosGestacaoList({
  breedingMatingUuid,
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseDiagnosticosGestacaoListProps) {
  return useCustomGridQueryById<PregnancyDiagnosisListItem, PregnancyDiagnosisFilterRequest>({
    registrationId: breedingMatingUuid ?? '',
    asyncFunctionById: listPregnancyDiagnoses,
    queryKey: queryKey.breedingMatings.pregnancyDiagnosesList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as PregnancyDiagnosisFilterRequest),
  });
}

/**
 * Visualização de um Diagnóstico de Gestação (`EP-PD-04`) — o legado NÃO
 * reaplica `breeding_mating.status == 2` neste verbo (CLM-PD-002, contrato de
 * API §6.2), fidelidade preservada também no front (nenhuma guarda extra de
 * status é aplicada aqui).
 * @param {string | undefined} breedingMatingUuid - uuid do Acasalamento pai (rota).
 * @param {string | undefined} pdUuid - uuid do Diagnóstico de Gestação (rota); `undefined`/inválido desabilita a query.
 * @return {UseQueryResult} Resultado da query (`PregnancyDiagnosisData`).
 */
export function useDiagnosticoGestacaoDetalhe(
  breedingMatingUuid: string | undefined,
  pdUuid: string | undefined
) {
  return useQuery({
    queryKey: [
      queryKey.breedingMatings.pregnancyDiagnosis,
      'detail',
      breedingMatingUuid ?? null,
      pdUuid ?? null,
    ],
    queryFn: async () => {
      const response = await getPregnancyDiagnosis(breedingMatingUuid!, pdUuid!);
      return response.data;
    },
    enabled: !!breedingMatingUuid && !!pdUuid,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export default useDiagnosticosGestacaoList;

// =============================================================================
// TASK-BM-FE-08 — contexto de CRIAÇÃO do Diagnóstico de Gestação
// (`CreateDiagnosticoGestacao.tsx`/`BreedingMatingReadonlyBlock.tsx`/
// `BatchFillSection.tsx`/`AnimalDiagnosisCard.tsx`).
// =============================================================================

/**
 * Contexto de criação do Diagnóstico de Gestação (`EP-PD-02`) — `next_code`,
 * `follow_up`, `last_protocol_date`, `eligible_animals`, o bloco readonly
 * `breeding_mating`, `lookups`, `cascade_rules` e `batch_fill_enabled`
 * (contrato de tela §5.5/§6.6). Não existe modo edição nesta sub-árvore
 * (`->except(['edit','update'])` no legado) — por isso não há hidratação
 * aqui, só o contexto de criação.
 * @param {string | undefined} breedingMatingUuid - uuid do Acasalamento pai (rota); `undefined`/inválido desabilita a query.
 * @return {UseQueryResult} Resultado da query (`PregnancyDiagnosisFormContext`).
 */
export function usePregnancyDiagnosisCreateContext(breedingMatingUuid: string | undefined) {
  return useQuery({
    queryKey: [
      queryKey.breedingMatings.pregnancyDiagnosis,
      'form-context',
      breedingMatingUuid ?? null,
    ],
    queryFn: async () => {
      const response = await getPregnancyDiagnosisCreateContext(breedingMatingUuid!);
      return response.data;
    },
    enabled: !!breedingMatingUuid,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
