// src/services/v2/BaseRegistrations/batch-areas-service.ts
// -----------------------------------------------------------------------------
// BatchArea Service — API v1 do backend Laravel GB.Cerne (vínculo N:N
// Lote×Área). TASK-FE-2100 (fundação de dados — execução 029). Mirror
// estrutural de `batch-grazings-service.ts` (irmã, TASK-FE-2000), trocando
// Módulo por Área.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /batch-areas                          → data: BatchAreaListItem[],
//                                                    meta REAL (paginação
//                                                    Laravel, `ApiResponse::
//                                                    paginated`, 10/página
//                                                    default).
//   GET    /batch-areas/{uuid}                    → data: BatchAreaData.
//   POST   /batch-areas                           → payload BatchAreaPayload.
//   DELETE /batch-areas/{uuid}                    → 204; encerra o vínculo
//                                                    INTEIRO, não-destrutivo
//                                                    (D12 do contrato de
//                                                    API — registra saída,
//                                                    nunca apaga histórico).
//   DELETE /batch-areas/{uuid}/batches/{batchUuid} → 204; remove só 1 lote
//                                                    do vínculo, mesma
//                                                    semântica não-destrutiva.
//
// `listBatchAreas` ADAPTA o envelope `ApiResponse::paginated` (meta REAL)
// para o shape `ResponsePagination` que `useCustomGridQuery` consome — mesmo
// adaptador estrutural de `listBatchGrazings`/`listGrazings` (lê
// `data.meta.*` de verdade, NÃO fabrica 1 única página a partir do array
// inteiro).
//
// Farm-scoped (`X-Farm-Id` injetado automaticamente por `src/services/api.ts`,
// sem ação do front). Binding por `uuid`, nunca `id` sequencial.
//
// FILTRO restaurado (TASK-FRONT-1, esteira 063-est03-9-reprovacoes, roteiro
// `lote-area-f143-roteiro.md §2`) — `area_uuid`/`batch_uuid`, já aceitos pelo
// backend (`BatchAreaFilterData`/`BatchAreaRepository::list()`), nenhuma
// mudança de API. `BatchGrazing`/`Grazing` (módulos irmãos) permanecem SEM
// filtro — não revertidos por esta correção.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BatchAreaData,
  BatchAreaFilterRequest,
  BatchAreaListItem,
  BatchAreaPayload,
  BatchAreasListEnvelope,
  EligibleAreasEnvelope,
  EligibleBatchAreasEnvelope,
} from '@/@types/v2/BaseRegistrations/batch-areas';

export interface ListBatchAreasParams extends PaginationQueryParams, BatchAreaFilterRequest {}

async function listBatchAreas(
  params: ListBatchAreasParams
): Promise<ResponsePagination<BatchAreaListItem[]>> {
  const { data } = await api.V2.get<BatchAreasListEnvelope>('/batch-areas', {
    page: params.page,
    per_page: params.per_page,
    area_uuid: params.area_uuid || undefined,
    batch_uuid: params.batch_uuid || undefined,
  });

  // Adaptação ApiResponse::paginated → ResponsePagination — LÊ o meta REAL do
  // backend (idêntico a listBatchGrazings/listGrazings), NÃO fabrica mais 1
  // página só a partir do array inteiro.
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// Lotes ELEGÍVEIS para vínculo NOVO — adendo pós-E2E Achados 3+4 (mirror
// exato de `listEligibleBatchesForGrazing`, `contrato-adendo-lotes-
// elegiveis-metricas.md §3`, TASK-FE-2105). SUBSTITUI `listBatchOptions`/
// `GET /batches/options` como fonte do picker "Lote" em
// `CreateBatchArea.tsx`. SEM paginação, SEM `search` no servidor (D6 do
// adendo).
async function listEligibleBatchesForArea() {
  const { data } = await api.V2.get<EligibleBatchAreasEnvelope>('/batch-areas/eligible-batches');
  return data;
}

// Áreas ELEGÍVEIS para vínculo NOVO — correção pós-reprovação de fidelidade
// (esteira 061-reprovacoes, `roteiro-lote-area-fidelidade.md §4.1`, mirror
// exato de `listEligibleBatchesForArea` acima). SUBSTITUI o loop de páginas
// sobre `GET /areas` como fonte do Select "Área" em `CreateBatchArea.tsx`:
// só áreas SEM módulo e SEM lote vinculado (mirror
// `AreaBatchController::create()` do legado). SEM paginação, SEM `search` no
// servidor (mirror `eligible-batches`).
async function listEligibleAreasForBatchArea() {
  const { data } = await api.V2.get<EligibleAreasEnvelope>('/batch-areas/eligible-areas');
  return data;
}

async function getBatchAreaByUuid(batchAreaUuid: string) {
  const { data } = await api.V2.get<Response<BatchAreaData>>(`/batch-areas/${batchAreaUuid}`);
  return data;
}

async function createBatchArea(payload: BatchAreaPayload) {
  const { data } = await api.V2.post<Response<BatchAreaData>>('/batch-areas', payload);
  return data;
}

// Encerra o vínculo INTEIRO — NÃO-destrutivo (D12 do contrato de API): o
// backend registra saída no histórico (`transfer_batch_grazing_areas`) em vez
// de apagar. O front só reflete o efeito (o vínculo some da listagem).
async function deleteBatchArea(batchAreaUuid: string) {
  const { data } = await api.V2.delete(`/batch-areas/${batchAreaUuid}`);
  return data;
}

// Remove só 1 lote do vínculo (`RemoveBatchFromAreaAction`, §5.2 do contrato
// de API) — mesma semântica não-destrutiva. O vínculo permanece com os
// demais lotes.
async function removeBatchFromArea(batchAreaUuid: string, batchUuid: string) {
  const { data } = await api.V2.delete(`/batch-areas/${batchAreaUuid}/batches/${batchUuid}`);
  return data;
}

export {
  createBatchArea,
  deleteBatchArea,
  getBatchAreaByUuid,
  listBatchAreas,
  listEligibleAreasForBatchArea,
  listEligibleBatchesForArea,
  removeBatchFromArea,
};
