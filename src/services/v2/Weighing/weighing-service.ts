// src/services/v2/Weighing/weighing-service.ts
// -----------------------------------------------------------------------------
// Weighing Service — API v1 do backend Laravel GB.Cerne (`/weighings*`),
// TASK-PES-FE-01. Fonte: CTR-PES
// (`CORE_WORKSPACE/01-Arquitetura_e_Contratos/contrato-api-lane-c-pesagem.md`),
// `CONTRATO_AUTOAPROVADO`, 9 endpoints `EP-PES-01..09`, Tester ✅.
//
// Reusa (NÃO duplica) os 4 lookups de cascata sanitária de
// `@/services/v2/Sanitaries/sanitaries-service` (Regra 7 da Tarefa) — o bloco
// condicional Sanitário embutido em Pesagem consome os MESMOS 4 endpoints
// AJAX (`EP-SAN-09..12`) que o CRUD raiz de Sanitário já expõe
// (contrato-tela-lane-c-pesagem-frontend.md §5.4, ADR-FE-PES-00).
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente.
// -----------------------------------------------------------------------------

import api from '@/services/api';
import {
  getSanitaryWarehouseStock,
  listSanitaryMeasurements,
  listSanitaryProductsByWarehouse,
  listSanitaryWarehousesByProduct,
} from '@/services/v2/Sanitaries/sanitaries-service';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CheckWeighingDateRequest,
  CheckWeighingDateResponse,
  SaveWeighingRequest,
  WeighingDetail,
  WeighingFilterRequest,
  WeighingFormContext,
  WeighingImportResult,
  WeighingListItem,
} from '@/@types/v2/Weighing';

const BASE = '/weighings';

// ---------------------------------------------------------------------------
// EP-PES-01 — GET /weighings (listagem paginada, filtro batch_uuid/
// category_uuid/user_uuid, ordenação fixa `code desc`, mirror `mode_matrix`).
// Envelope adaptado do `ApiResponse` flat para `ResponsePagination`
// (`useCustomGridQuery`), mesma técnica de `listSanitaries`/`listWeanings`.
// ---------------------------------------------------------------------------
export interface ListWeighingsParams extends PaginationQueryParams, WeighingFilterRequest {}

interface WeighingsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface WeighingsListEnvelope {
  success: boolean;
  message: string;
  data: WeighingListItem[];
  errors: Record<string, string[]> | null;
  meta: WeighingsApiPaginationMeta | null;
}

async function listWeighings(
  params: ListWeighingsParams
): Promise<ResponsePagination<WeighingListItem[]>> {
  const { data } = await api.V2.get<WeighingsListEnvelope>(BASE, {
    page: params.page,
    per_page: params.per_page,
    batch_uuid: params.batch_uuid || undefined,
    category_uuid: params.category_uuid || undefined,
    user_uuid: params.user_uuid || undefined,
  });

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

// EP-PES-02 — GET /weighings/{uuid} (detalhe, edição e visualização).
async function getWeighingByUuid(uuid: string): Promise<Response<WeighingDetail>> {
  const { data } = await api.V2.get<Response<WeighingDetail>>(`${BASE}/${uuid}`);
  return data;
}

// ---------------------------------------------------------------------------
// `GET /weighings/next-code` — preview do próximo `code`, SÓ chamado em modo
// CRIAÇÃO (97-Esteiras/002 execução 002 lane C, correção reportada pelo dono
// ao vivo: a API passou a expor este endpoint, ANTES ausente — o texto
// estático "Gerado ao salvar" agora só é fallback enquanto a query carrega/
// falha). Mirror EXATO `getSanitaryNextCode` (`sanitaries-service.ts`,
// mesma correção): o Controller real (`WeighingRecordController::
// nextCode()`, worktree irmão da API) devolve `{ next_code: string }`.
// ---------------------------------------------------------------------------
async function getWeighingNextCode(): Promise<Response<{ next_code: string }>> {
  const { data } = await api.V2.get<Response<{ next_code: string }>>(`${BASE}/next-code`);
  return data;
}

// ---------------------------------------------------------------------------
// Contexto de formulário — NÃO é chamada de rede. `code` é gerado
// atomicamente dentro de `POST /weighings`; mantido como estava (o
// `next_code` real agora disponível é obtido via `getWeighingNextCode()`
// acima, chamada de rede própria — este helper client-side NÃO foi adaptado
// para chamá-la, fora do escopo desta correção). `lookups` é só
// documentação de quais serviços JÁ EXISTENTES a tela deve reusar
// (contrato-tela §5.4) — nunca chamados por este service diretamente.
// ---------------------------------------------------------------------------
function getWeighingFormContext(): WeighingFormContext {
  return {
    next_code: null,
    lookups: {
      animals: 'GET /animals/options?batch_uuid=|category_uuid=',
      products: 'GET /sanitaries/products-by-warehouse/{warehouseUuid}',
      warehouses: 'GET /sanitaries/warehouses-by-product/{productUuid}',
      measurements: 'GET /sanitaries/measurements/{productUuid}',
      stock: 'GET /sanitaries/warehouse-stock/{warehouseUuid}/{productUuid}',
    },
  };
}

// EP-PES-03 — POST /weighings.
async function createWeighing(payload: SaveWeighingRequest): Promise<Response<WeighingDetail>> {
  const { data } = await api.V2.post<Response<WeighingDetail>>(BASE, payload);
  return data;
}

// EP-PES-04 — PUT /weighings/{uuid}.
async function updateWeighing(
  uuid: string,
  payload: SaveWeighingRequest
): Promise<Response<WeighingDetail>> {
  const { data } = await api.V2.put<Response<WeighingDetail>>(`${BASE}/${uuid}`, payload);
  return data;
}

// EP-PES-05 — DELETE /weighings/{uuid}.
async function deleteWeighing(uuid: string): Promise<void> {
  await api.V2.delete(`${BASE}/${uuid}`);
}

// ---------------------------------------------------------------------------
// EP-PES-06/07 — Import/Template (contrato-tela §6.3, mirror
// `downloadBirthAnimalTemplate`/`importBirthAnimals`). Padrão de atomicidade
// CONFIRMADO na TASK-PES-FE-03 por leitura direta do worktree irmão da API
// (`ImportWeighingAction`/`ImportWeighingRequest`/`WeighingRecordController`):
// ABORT-ALL — sucesso (200) só quando TODAS as linhas são válidas,
// `WeighingImportResultData{created,weighings_created}`; qualquer linha
// inválida aborta com 422 (`BusinessRuleException`, `errors.rows: string[]`).
// Mesmo shape do mirror `BirthAnimalImportModal`/`ImportBirthAnimalsAction` —
// nenhuma divergência a documentar.
// ---------------------------------------------------------------------------
async function downloadWeighingTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`${BASE}/template`, undefined, {
    responseType: 'blob',
  });
  return data;
}

async function importWeighings(file: File): Promise<Response<WeighingImportResult>> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.V2.post<Response<WeighingImportResult>>(`${BASE}/import`, formData);
  return data;
}

// ---------------------------------------------------------------------------
// EP-PES-08 — GET /weighings/{uuid}/report (relatório individual, download
// síncrono, blob) — ação de linha, SEM tela própria, mirror
// `MarkingActionsMenu.onPrint` (contrato-tela §1.1/§6.2).
// ---------------------------------------------------------------------------
async function downloadWeighingReport(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`${BASE}/${uuid}/report`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// ---------------------------------------------------------------------------
// EP-PES-09 — GET /weighings/check-date — aviso não-bloqueante (mirror IG
// legado), dispara ao mudar `date`+(`batch_uuid`|`category_uuid`) e ao
// selecionar animal (contrato-tela §5.4/§6.4). Diferente do check-date de
// Sanitário (que não existe): aqui o endpoint EXISTE e é
// `CONTRATO_AUTOAPROVADO` — PRESERVAR, não omissão.
// ---------------------------------------------------------------------------
async function checkWeighingDate(
  params: CheckWeighingDateRequest
): Promise<Response<CheckWeighingDateResponse>> {
  const { data } = await api.V2.get<Response<CheckWeighingDateResponse>>(`${BASE}/check-date`, {
    date: params.date,
    batch_uuid: params.batch_uuid || undefined,
    category_uuid: params.category_uuid || undefined,
    animal_uuid: params.animal_uuid || undefined,
    animal_uuids: params.animal_uuids?.length ? params.animal_uuids : undefined,
    weighing_uuid: params.weighing_uuid || undefined,
  });
  return data;
}

export {
  checkWeighingDate,
  createWeighing,
  deleteWeighing,
  downloadWeighingReport,
  downloadWeighingTemplate,
  getSanitaryWarehouseStock,
  getWeighingByUuid,
  getWeighingFormContext,
  getWeighingNextCode,
  importWeighings,
  listSanitaryMeasurements,
  listSanitaryProductsByWarehouse,
  listSanitaryWarehousesByProduct,
  listWeighings,
  updateWeighing,
};
