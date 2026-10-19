// src/pages/BaseRegistrations/BatchAreas/useBatchAreas.tsx
// -----------------------------------------------------------------------------
// Hooks de query do vínculo Lote/Área (BatchArea) — mirror
// `BatchGrazings/useBatchGrazings.tsx` (irmã estrutural, TASK-FE-2000/2001/
// 2003), trocando Módulo por Área. TASK-FE-2100/2101/2103 (execução 029).
//
// `useBatchAreaList`/`useBatchAreaForm` são consumidos pela listagem
// (`index.tsx`, TASK-FE-2101) e pelo detalhe (`BatchAreaDetalhe.tsx`,
// TASK-FE-2103). `useEligibleAreasChecklist`/`useEligibleBatchesChecklist`
// alimentam SÓ o formulário de criação (`CreateBatchArea.tsx`, TASK-FE-2102).
//
// `useBatchAreaList` recebe `filter` (TASK-FRONT-1, esteira
// 063-est03-9-reprovacoes) — `BatchAreaFilterRequest` já achatado (Option →
// uuid) por `index.tsx::toRequestFilter`, NUNCA o tipo Option-based
// `BatchAreaFilterForm` diretamente (mirror `useCustomGridQuery` de
// `WarehouseTransfer/index.tsx`/`Nutrition/index.tsx`).
//
// `useEligibleBatchesChecklist` — adicionado pela correção pós-E2E dos
// Achados 3+4 (TASK-FE-2105, `contrato-adendo-lotes-elegiveis-metricas.md`),
// SUBSTITUI o antigo `useBatchOptionsChecklist`/`GET /batches/options` nesta
// tela (removido — sem outro consumidor neste arquivo).
//
// `useEligibleAreasChecklist` — correção pós-reprovação de fidelidade
// (esteira 061-reprovacoes, `roteiro-lote-area-fidelidade.md §4.1/§4.2`),
// SUBSTITUI o antigo `useAreaOptionsForBatchArea` (loop de páginas sobre
// `GET /areas`, que listava TODAS as áreas ativas, inclusive já vinculadas —
// divergência de fidelidade contra `AreaBatchController::create()` do
// legado, que nunca oferece uma área já vinculada). `GET /batch-areas/
// eligible-areas` (mirror exato de `eligible-batches`) já filtra
// server-side; 1 fetch único, sem paginação (mirror
// `useEligibleBatchesChecklist` abaixo, não mais o loop antigo).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getBatchAreaByUuid,
  listBatchAreas,
  listEligibleAreasForBatchArea,
  listEligibleBatchesForArea,
} from '@/services/v2/BaseRegistrations/batch-areas-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  BatchAreaData,
  BatchAreaFilterRequest,
  BatchAreaListItem,
} from '@/@types/v2/BaseRegistrations/batch-areas';

interface UseBatchAreaListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter: BatchAreaFilterRequest;
}

// Query de listagem — filtro restaurado (TASK-FRONT-1, esteira
// 063-est03-9-reprovacoes, roteiro `lote-area-f143-roteiro.md §2`).
// `filter` chega JÁ achatado (`BatchAreaFilterRequest`, uuid) de
// `index.tsx::toRequestFilter` — este hook só repassa ao
// `useCustomGridQuery`, mesmo mirror de `Nutrition`/`WarehouseTransfer`.
export function useBatchAreaList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseBatchAreaListProps) {
  return useCustomGridQuery<BatchAreaListItem, BatchAreaFilterRequest>({
    asyncFunction: listBatchAreas,
    queryKey: queryKey.batchAreas.batchAreasList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter,
  });
}

interface UseBatchAreaFormProps {
  registrationId?: string;
  fillForm: (data: BatchAreaData, resetForce?: boolean) => void;
}

// Query de detalhe — consumida pelo card de visualização
// (`BatchAreaDetalhe.tsx`, SEM `useForm`/RHF, `fillForm` é um no-op ali —
// mirror `useCostCenterForm`/`useBatchGrazingForm`). Estruturalmente poderia
// alimentar um formulário de edição futuro (que não existe — API sem
// `PUT`/`PATCH`, D1 do contrato de API).
export function useBatchAreaForm({ registrationId, fillForm }: UseBatchAreaFormProps) {
  return useCustomFormQueryByGuid<BatchAreaData>({
    registrationId,
    queryKey: queryKey.batchAreas.batchArea,
    asyncFunction: getBatchAreaByUuid,
    fillForm,
  });
}

// Áreas ELEGÍVEIS — alimenta o Select single "Área" da criação
// (`CreateBatchArea.tsx`). Correção pós-reprovação de fidelidade (esteira
// 061-reprovacoes, `roteiro-lote-area-fidelidade.md §4.1/§4.2`) — SUBSTITUI
// o antigo loop de páginas sobre `GET /areas` (todas as áreas ativas,
// inclusive já vinculadas): `GET /batch-areas/eligible-areas` já filtra
// server-side (só áreas SEM módulo e SEM lote vinculado, mirror
// `AreaBatchController::create()` do legado) e devolve a Collection inteira
// em 1 fetch (SEM paginação, mirror `eligible-batches`) — o preview de
// Hectares continua funcionando via `EligibleArea.total_area`.
export function useEligibleAreasChecklist() {
  return useQuery({
    queryKey: [queryKey.batchAreas.eligibleAreas],
    queryFn: async () => {
      const response = await listEligibleAreasForBatchArea();
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

// Lotes ELEGÍVEIS — alimenta o `CheckboxListField` "Lote" da criação
// (correção pós-E2E Achados 3+4, TASK-FE-2105). Mirror 1:1
// `BatchGrazings/useBatchGrazings.tsx: useEligibleBatchesChecklist`.
// SUBSTITUI o antigo `useBatchOptionsChecklist`/`GET /batches/options`
// NESTA TELA — aquele endpoint listava TODOS os lotes ativos (sem filtro de
// elegibilidade, Achado 4) e só devolvia `{uuid,label}`, sem
// `quantity_animal`/`weight` (Achado 3). `GET /batch-areas/eligible-batches`
// devolve SÓ os lotes elegíveis (ACTIVE, sem Módulo nem Área vinculado) +
// as 2 métricas agregadas — SEM a entrada sintética "Sem lote".
//
// SEM `search` no servidor (D6 do adendo) — 1 fetch da Collection inteira,
// filtro CLIENT-SIDE dentro do consumidor. SEM `keepPreviousData` — alinhado
// com `BatchGrazings/useBatchGrazings.tsx` (nenhuma das duas re-dispara
// query por busca agora).
export function useEligibleBatchesChecklist() {
  return useQuery({
    queryKey: [queryKey.batchAreas.eligibleBatches],
    queryFn: async () => {
      const response = await listEligibleBatchesForArea();
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}
