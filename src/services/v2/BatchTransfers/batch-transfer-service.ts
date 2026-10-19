// src/services/v2/BatchTransfers/batch-transfer-service.ts
// -----------------------------------------------------------------------------
// Service da feature TRANSFERÊNCIA ANIMAIS/LOTE (BatchTransfer, `426be835`,
// TASK-LOTE-FE-01/02) — 3 endpoints próprios (`BatchTransferController`,
// todos já materializados e verificados no fork). O picker de animais REUSA
// `listBatchCandidateAnimals` de `src/services/v2/Batches/batch-service.ts`
// (contrato §7 — "reaproveitar, não duplicar"), consumido direto por
// `useBatchTransfers.tsx`, não reexportado aqui.
//
// `X-Farm-Id` é injetado pelo interceptor global (`src/services/api.ts`) —
// NUNCA setado manualmente aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BatchTransferCreateOptions,
  BatchTransferResult,
  CreateBatchTransferRequest,
  EligibleAnimal,
  EligibleAnimalsListEnvelope,
} from '@/@types/v2/BatchTransfers';

export interface ListEligibleAnimalsParams extends PaginationQueryParams {
  category_uuid?: string;
  batch_uuid?: string;
  /** Igualdade EXATA no backend — não `ILIKE` (contrato §5.3/§4.3). */
  identification?: string;
}

// GET /batch-transfers/eligible-animals — 🔴 adaptação À MÃO do envelope
// (`ApiResponse::paginated`) para `ResponsePagination` — mirror LITERAL de
// `getBatches` (`src/services/v2/Batches/batch-service.ts`). O interceptor
// genérico NÃO desempacota; sem esta adaptação `useCustomGridQuery` não pagina.
export async function listEligibleAnimals(
  params: ListEligibleAnimalsParams
): Promise<ResponsePagination<EligibleAnimal[]>> {
  const { data } = await api.V2.get<EligibleAnimalsListEnvelope>(
    '/batch-transfers/eligible-animals',
    {
      page: params.page,
      per_page: params.per_page,
      category_uuid: params.category_uuid || undefined,
      batch_uuid: params.batch_uuid || undefined,
      identification: params.identification || undefined,
    }
  );

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// GET /batch-transfers/create-options — lookups do filtro (Tarefa 26) e do
// formulário (Tarefa 27). 🔴 NÃO devolve `user` — "Responsável" vem de
// `useAuth()` no consumidor, nunca de `data.data.user` (não existe).
export async function getBatchTransferCreateOptions(): Promise<
  Response<BatchTransferCreateOptions>
> {
  const { data } = await api.V2.get<Response<BatchTransferCreateOptions>>(
    '/batch-transfers/create-options'
  );
  return data;
}

// POST /batch-transfers — só 3 campos no payload (`date`/`batch_id`/
// `animals[]`, contrato §6.1) — usado só na Tarefa 27.
export async function createBatchTransfer(
  payload: CreateBatchTransferRequest
): Promise<Response<BatchTransferResult>> {
  const { data } = await api.V2.post<Response<BatchTransferResult>>('/batch-transfers', payload);
  return data;
}
