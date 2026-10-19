// src/@types/v2/GrouperBatches/index.d.ts
// -----------------------------------------------------------------------------
// Tipos dos 2 endpoints NOVOS da feature Agrupar/Lotes (GrouperBatch,
// execução 042, TASK-FE-042-301): `GET`/`POST /grouper-batches`. Contrato
// de API §4 (`GrouperBatch-contrato.md`).
//
// A resposta do POST reaproveita `Response<BatchData>` de `@/@types/v2/Batches`
// (o `AnimalBatchResource` do lote principal, já atualizado) — NÃO
// redeclarado aqui.
// -----------------------------------------------------------------------------

export interface GrouperBatchLookupItem {
  uuid: string;
  code: string;
  description: string;
  animals_count: number;
}

export interface GrouperBatchLookupEnvelope {
  success: boolean;
  message: string;
  data: GrouperBatchLookupItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}

export interface GroupBatchesPayload {
  batch_uuids: string[];
  correct_batch_uuid: string;
}
