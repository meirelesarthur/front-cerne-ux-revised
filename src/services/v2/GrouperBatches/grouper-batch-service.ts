// src/services/v2/GrouperBatches/grouper-batch-service.ts
// -----------------------------------------------------------------------------
// Service dos 2 endpoints NOVOS da feature Agrupar/Lotes (GrouperBatch,
// execução 042, TASK-FE-042-302) — `GET`/`POST /grouper-batches`. Mirror
// EXATO de `Stocks/stock-service.ts::previewStockConsolidation`/
// `consolidateStocks` (mesmo padrão "prévia sob demanda" + "confirmação").
//
// `lookupGrouperBatches` (GET) devolve o array cru (`Response<
// GrouperBatchLookupItem[]>`) — `meta` do envelope real é SEMPRE `null`
// (contrato de API §4), NÃO adaptado para `ResponsePagination` (não é um
// grid, é uma lista fixa de itens já selecionados pelo usuário na tela).
// `groupBatches` (POST) devolve o `AnimalBatchResource` do lote principal
// já atualizado — `Response<BatchData>`, tipo reaproveitado de
// `@/@types/v2/Batches` (NÃO redeclarado).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { BatchData } from '@/@types/v2/Batches';
import type { GroupBatchesPayload, GrouperBatchLookupItem } from '@/@types/v2/GrouperBatches';

export interface LookupGrouperBatchesParams {
  batch_uuids: string[];
}

export async function lookupGrouperBatches(
  params: LookupGrouperBatchesParams
): Promise<Response<GrouperBatchLookupItem[]>> {
  const { data } = await api.V2.get<Response<GrouperBatchLookupItem[]>>('/grouper-batches', {
    batch_uuids: params.batch_uuids,
  });
  return data;
}

export async function groupBatches(payload: GroupBatchesPayload): Promise<Response<BatchData>> {
  const { data } = await api.V2.post<Response<BatchData>>('/grouper-batches', payload);
  return data;
}
