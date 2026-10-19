// src/services/v2/BaseRegistrations/batch-grazings-service.ts
// -----------------------------------------------------------------------------
// BatchGrazing Service — API v1 do backend Laravel GB.Cerne (vínculo N:N
// Lote×Módulo de Pastejo). TASK-FE-2000 (fundação de dados — execução 029).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /batch-grazings                          → data: BatchGrazingListItem[],
//                                                       meta REAL (paginação Laravel,
//                                                       `ApiResponse::paginated`, 10/página
//                                                       default).
//   GET    /batch-grazings/{uuid}                    → data: BatchGrazingData.
//   POST   /batch-grazings                           → payload BatchGrazingPayload.
//   DELETE /batch-grazings/{uuid}                    → 204; encerra o vínculo INTEIRO,
//                                                       não-destrutivo (D3/D12 do
//                                                       contrato de API — registra saída,
//                                                       nunca apaga histórico).
//   DELETE /batch-grazings/{uuid}/batches/{batchUuid} → 204; remove só 1 lote do vínculo,
//                                                       mesma semântica não-destrutiva.
//
// `listBatchGrazings` ADAPTA o envelope `ApiResponse::paginated` (meta REAL)
// para o shape `ResponsePagination` que `useCustomGridQuery` consome — mesmo
// adaptador estrutural de `listGrazings`/`listFodders` (lê `data.meta.*` de
// verdade, NÃO fabrica 1 única página a partir do array inteiro).
//
// Farm-scoped (`X-Farm-Id` injetado automaticamente por `src/services/api.ts`,
// sem ação do front). Binding por `uuid`, nunca `id` sequencial.
//
// SEM FILTRO (mirror `Grazing`/`Fodder`, `contrato-fe-lote-modulo.md §2`) —
// params da listagem são só `PaginationQueryParams` (`page`/`per_page`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BatchGrazingData,
  BatchGrazingListItem,
  BatchGrazingPayload,
  BatchGrazingsListEnvelope,
  EligibleBatchGrazingsEnvelope,
  EligibleGrazingsEnvelope,
} from '@/@types/v2/BaseRegistrations/batch-grazings';

async function listBatchGrazings(
  params: PaginationQueryParams
): Promise<ResponsePagination<BatchGrazingListItem[]>> {
  const { data } = await api.V2.get<BatchGrazingsListEnvelope>('/batch-grazings', {
    page: params.page,
    per_page: params.per_page,
    // Sem `search`/etc. — a feature não tem busca (contrato de tela §2). O
    // front nunca envia filtro nesta listagem.
  });

  // Adaptação ApiResponse::paginated → ResponsePagination — LÊ o meta REAL do
  // backend (idêntico a listGrazings/listFodders), NÃO fabrica mais 1 página
  // só a partir do array inteiro.
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

// Lotes ELEGÍVEIS para vínculo NOVO — adendo pós-E2E Achados 3+4
// (`contrato-adendo-lotes-elegiveis-metricas.md §3`, TASK-FE-2005).
// SUBSTITUI `listBatchOptions`/`GET /batches/options` como fonte do picker
// "Lote" em `CreateBatchGrazing.tsx`: só lotes elegíveis (ACTIVE, sem Módulo
// nem Área vinculado) + `quantity_animal`/`weight` para o preview ao vivo.
// SEM paginação (Collection inteira) e SEM `search` no servidor (D6 do
// adendo — filtro client-side, dataset pequeno).
async function listEligibleBatchesForGrazing() {
  const { data } = await api.V2.get<EligibleBatchGrazingsEnvelope>(
    '/batch-grazings/eligible-batches'
  );
  return data;
}

// Módulos de Pastejo ELEGÍVEIS para vínculo NOVO — correção pós-reprovação
// de fidelidade (esteira 061-reprovacoes, `roteiro-lote-modulo-fidelidade.md
// §4.1`, mirror exato de `listEligibleBatchesForGrazing` acima). SUBSTITUI o
// fetch cru de `listGrazings` como fonte do Select "Módulo" em
// `CreateBatchGrazing.tsx`: só módulos SEM lote vinculado (mirror
// `BatchGrazingController::create()` do legado). SEM paginação, SEM
// `search` no servidor (mirror `eligible-batches`).
async function listEligibleGrazingsForBatchGrazing() {
  const { data } = await api.V2.get<EligibleGrazingsEnvelope>('/batch-grazings/eligible-grazings');
  return data;
}

async function getBatchGrazingByUuid(batchGrazingUuid: string) {
  const { data } = await api.V2.get<Response<BatchGrazingData>>(
    `/batch-grazings/${batchGrazingUuid}`
  );
  return data;
}

async function createBatchGrazing(payload: BatchGrazingPayload) {
  const { data } = await api.V2.post<Response<BatchGrazingData>>('/batch-grazings', payload);
  return data;
}

// Encerra o vínculo INTEIRO — NÃO-destrutivo (D3/D12 do contrato de API): o
// backend registra saída no histórico (`transfer_batch_grazing_areas`) em vez
// de apagar. O front só reflete o efeito (o vínculo some da listagem).
async function deleteBatchGrazing(batchGrazingUuid: string) {
  const { data } = await api.V2.delete(`/batch-grazings/${batchGrazingUuid}`);
  return data;
}

// Remove só 1 lote do vínculo (equivalente ao `destroyBatch` legado, §5.2 do
// contrato de API) — mesma semântica não-destrutiva. O módulo permanece com
// os demais lotes.
async function removeBatchFromGrazing(batchGrazingUuid: string, batchUuid: string) {
  const { data } = await api.V2.delete(`/batch-grazings/${batchGrazingUuid}/batches/${batchUuid}`);
  return data;
}

export {
  createBatchGrazing,
  deleteBatchGrazing,
  getBatchGrazingByUuid,
  listBatchGrazings,
  listEligibleBatchesForGrazing,
  listEligibleGrazingsForBatchGrazing,
  removeBatchFromGrazing,
};
