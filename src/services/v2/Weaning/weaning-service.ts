// src/services/v2/Weaning/weaning-service.ts
// -----------------------------------------------------------------------------
// Weaning Service — API v1 do backend Laravel GB.Cerne (`/weanings*`,
// TASK-WN-FE-02). Fonte: leitura DIRETA de
// `app/Http/Controllers/Api/V1/WeaningController.php` +
// `app/Http/Requests/Api/V1/WeaningRequest.php` (fork `GB.Cerne.Api`).
//
// Envelope paginado (`ApiResponse::paginated`) — mesma adaptação de
// `listBirthAnimals`/`listTransfers`/`listMovementSales`: a API devolve
// `{ data: [array plano], meta: { current_page, last_page, per_page, total } }`,
// o `useCustomGridQuery` espera `ResponsePagination<T>` (`data.items`/
// `data.pagination`). Adaptação feita aqui, nunca no componente.
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente.
//
// `updateWeaning` envia o payload COMPLETO (`date`/`batch_uuid`/
// `animal_uuids` sempre, `transfer_batch_uuid` quando houver) — a
// `WeaningRequest::rules()` real exige esses campos também no update (sem
// `sometimes`), diferente do padrão de PATCH parcial por `dirtyFields`
// usado em outros módulos. `type`/`code` NUNCA são enviados no update
// (imutáveis, corrige OQ-07 — a própria `WeaningRequest` real ignora `type`
// fora do POST).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateWeaningRequest,
  UpdateWeaningRequest,
  WeaningData,
  WeaningFilterRequest,
  WeaningLookupAnimalOption,
} from '@/@types/v2/Weaning';

const BASE = '/weanings';

export interface ListWeaningsParams extends PaginationQueryParams, WeaningFilterRequest {}

interface WeaningsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface WeaningsListEnvelope {
  success: boolean;
  message: string;
  data: WeaningData[];
  errors: Record<string, string[]> | null;
  meta: WeaningsApiPaginationMeta | null;
}

async function listWeanings(
  params: ListWeaningsParams
): Promise<ResponsePagination<WeaningData[]>> {
  const { data } = await api.V2.get<WeaningsListEnvelope>(BASE, {
    page: params.page,
    per_page: params.per_page,
    responsible_uuid: params.responsible_uuid || undefined,
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

async function getWeaningByUuid(uuid: string): Promise<Response<WeaningData>> {
  const { data } = await api.V2.get<Response<WeaningData>>(`${BASE}/${uuid}`);
  return data;
}

async function createWeaning(payload: CreateWeaningRequest): Promise<Response<WeaningData>> {
  const { data } = await api.V2.post<Response<WeaningData>>(BASE, payload);
  return data;
}

async function updateWeaning(
  uuid: string,
  payload: UpdateWeaningRequest
): Promise<Response<WeaningData>> {
  const { data } = await api.V2.put<Response<WeaningData>>(`${BASE}/${uuid}`, payload);
  return data;
}

async function deleteWeaning(uuid: string): Promise<void> {
  await api.V2.delete(`${BASE}/${uuid}`);
}

// Cascata IG-01 — recarrega opções de Animal (mãe) ao trocar `batch_uuid`
// (mirror `LookupAnimalsForWeaningAction` real: `GET /weanings/lookup-
// animals?batch_uuid=`). Resposta é um array simples (Action de leitura,
// sem paginação real) — ADAPTADO para o shape `ResponsePagination` que
// `SelectAsyncPaginate` consome como `service`, mirror
// `listCandidateMothers`/`listBatchOptions` (meta sempre null, 1 única
// "página" com o array inteiro).
export interface LookupAnimalsForWeaningParams extends PaginationQueryParams {
  batch_uuid?: string;
}

async function lookupAnimalsForWeaning(
  params: LookupAnimalsForWeaningParams
): Promise<ResponsePagination<WeaningLookupAnimalOption[]>> {
  const { data } = await api.V2.get<Response<WeaningLookupAnimalOption[]>>(
    `${BASE}/lookup-animals`,
    {
      batch_uuid: params.batch_uuid || undefined,
    }
  );

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

/**
 * Mapeia `WeaningLookupAnimalOption` → `Option<string>` do select, mirror
 * `mapOptions` de `listCandidateMothers`/`listBatchOptions`.
 * @param {WeaningLookupAnimalOption} item - Item devolvido por `lookupAnimalsForWeaning`.
 * @return {Option<string>} Opção `{label, value}` para o `SelectAsyncPaginate`.
 */
export function mapWeaningLookupAnimalToOption(item: WeaningLookupAnimalOption): Option<string> {
  return { label: item.identification, value: item.uuid };
}

// Relatório — download síncrono (blob), formato explícito (corrige OQ-10).
// `GenerateWeaningReportAction` real é síncrono (PDF stream / XLSX
// download), sem AsyncJob — mirror `downloadInvoiceXml`
// (`responseType: 'blob'`).
export interface DownloadWeaningReportParams {
  start_date: string;
  end_date: string;
  format: 'pdf' | 'xlsx';
}

async function downloadWeaningReport(params: DownloadWeaningReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    `${BASE}/report`,
    {
      start_date: params.start_date,
      end_date: params.end_date,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export {
  createWeaning,
  deleteWeaning,
  downloadWeaningReport,
  getWeaningByUuid,
  listWeanings,
  lookupAnimalsForWeaning,
  updateWeaning,
};
