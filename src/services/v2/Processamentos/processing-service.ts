// src/services/v2/Processamentos/processing-service.ts
// -----------------------------------------------------------------------------
// Processing Service — API v1 do backend Laravel GB.Cerne (Processamentos —
// Operacional > Pecuária, 97-Esteiras/039, TASK-FE-039-PROC-01). Mirror do
// adaptador de envelope paginado → `ResponsePagination` já usado por
// `transferAbcBatch-service.ts`/`movement-sale-service.ts`.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET  /processings               → data: ProcessingListItem[], meta paginação REAL
//   GET  /processings/{uuid}        → data: ProcessingDetail
//   POST /processings/{uuid}/finish → payload FinishProcessingRequest → data: ProcessingDetail
//
// SEM `createProcessing`/`updateProcessing`/`deleteProcessing` — não existem
// na API (`ProcessingController` só expõe index/show/finish, sem
// store/update/destroy, front-plan-proc.md §1.1) — não criar função morta.
//
// `api.V2` já injeta Sanctum (cookie) + `X-Farm-Id` pelo interceptor genérico
// (`@/services/api.ts`) — nunca manipulado aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  FinishProcessingRequest,
  ProcessingDetail,
  ProcessingListItem,
  ProcessingPrepareData,
  ProcessingsListEnvelope,
  ProcessingStatusValue,
} from '@/@types/v2/Processamentos/processing';

// REWORK (039, FD-R2 desbloqueada) — `index` agora aceita os 3 campos por
// `uuid` (resolvidos para id interno server-side, `ProcessingRepository`);
// `area_uuid`⊕`grazing_uuid` seguem exclusivos (`prohibits` no backend).
export interface ListProcessingsParams extends PaginationQueryParams {
  status?: ProcessingStatusValue;
  batch_uuid?: string;
  area_uuid?: string;
  grazing_uuid?: string;
}

async function getAllProcessings(
  params: ListProcessingsParams
): Promise<ResponsePagination<ProcessingListItem[]>> {
  const { data } = await api.V2.get<ProcessingsListEnvelope>('/processings', {
    page: params.page,
    per_page: params.per_page,
    status: params.status ?? undefined,
    batch_uuid: params.batch_uuid ?? undefined,
    area_uuid: params.area_uuid ?? undefined,
    grazing_uuid: params.grazing_uuid ?? undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de `listTransferAbcBatches`/`listMovementSales`.
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

// GET /processings/{uuid} — detalhe (FD4: `batch_id`/`animals_snapshot`
// tipados como valor opaco no DTO, não renderizados pela UI).
async function getProcessingByUuid(uuid: string): Promise<Response<ProcessingDetail>> {
  const { data } = await api.V2.get<Response<ProcessingDetail>>(`/processings/${uuid}`);
  return data;
}

// POST /processings/{uuid}/finish — finalização. REWORK (039, PROC-04): o
// editor de `animals[]` agora abre pré-populado via `getProcessingPrepare`
// (abaixo) — o payload continua montado 1:1 do formulário, `finish` em si
// inalterado.
async function finishProcessing(
  uuid: string,
  payload: FinishProcessingRequest
): Promise<Response<ProcessingDetail>> {
  const { data } = await api.V2.post<Response<ProcessingDetail>>(
    `/processings/${uuid}/finish`,
    payload
  );
  return data;
}

// GET /processings/{uuid}/prepare — REWORK (039, PROC-04, resolve o bug de
// duplicação #2). `processing_create` (mirror do legado, ação de escrita).
async function getProcessingPrepare(uuid: string): Promise<Response<ProcessingPrepareData>> {
  const { data } = await api.V2.get<Response<ProcessingPrepareData>>(
    `/processings/${uuid}/prepare`
  );
  return data;
}

// DELETE /processings/{uuid} — REWORK (039, PROC-05, resolve gap #4).
// Reverte `FINISHED`→`PENDING` (RW-D/RW-E do roteiro de API: NÃO reverte
// categoria/raça/peso, fiel ao legado). Gate `processing_delete`.
async function cancelProcessing(uuid: string): Promise<Response<ProcessingDetail>> {
  const { data } = await api.V2.delete(`/processings/${uuid}`);
  return data as Response<ProcessingDetail>;
}

// POST /processings/{uuid}/import — REWORK (039, PROC-11, resolve gap #16).
// Restrito a origem Compra (`type` FQCN `App\Models\MovementPurchase`, normalizado por `isMovementPurchaseOrigin`) + `PENDING` (RW-F do
// roteiro de API) — gate de visibilidade já aplicado no front, o 422 real
// do servidor é a autoridade final. Multipart, mesma regra de
// `importBirthAnimals`.
async function importProcessingSpreadsheet(
  uuid: string,
  file: File
): Promise<Response<ProcessingDetail>> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.V2.post<Response<ProcessingDetail>>(
    `/processings/${uuid}/import`,
    formData
  );
  return data;
}

// GET /processings/template — REWORK (039, PROC-11) — download do modelo de
// planilha (binário, fora do envelope `ApiResponse`, mirror
// `downloadBirthAnimalTemplate`).
async function downloadProcessingTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/processings/template', undefined, {
    responseType: 'blob',
  });
  return data;
}

export {
  cancelProcessing,
  downloadProcessingTemplate,
  finishProcessing,
  getAllProcessings,
  getProcessingByUuid,
  getProcessingPrepare,
  importProcessingSpreadsheet,
};
