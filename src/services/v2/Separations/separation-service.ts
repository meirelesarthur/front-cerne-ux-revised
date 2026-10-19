// src/services/v2/Separations/separation-service.ts
// -----------------------------------------------------------------------------
// Separation Service — API v1 do backend Laravel GB.Cerne (`/separations*`,
// api-contract-apartacao.md, frontend-contract-apartacao.md §3,
// TASK-APART-FE-01).
//
// Fundação desta Tarefa: `listSeparations`/`getSeparationByUuid`/
// `deleteSeparation`. `createSeparation`/`updateSeparation`/
// `checkSeparationDate` são consumidos pela Tarefa 25 (formulário), mas
// declarados aqui por instrução da fundação (contrato §8 — "o arquivo de
// serviço nasce aqui").
//
// Envelope paginado (`ApiResponse::paginated`) — mesma adaptação de
// `listBirthAnimals`/`listMovementSales`: a API devolve `{ data: [array
// plano], meta: { current_page, last_page, per_page, total } }`, o
// `useCustomGridQuery` espera `ResponsePagination<T>` (`data.items`/
// `data.pagination`). Adaptação feita aqui, nunca no componente.
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CheckSeparationDateResult,
  CreateOrUpdateSeparationRequest,
  SeparationDetail,
  SeparationFilterRequest,
  SeparationListItem,
} from '@/@types/v2/Separations';

export interface ListSeparationsParams extends PaginationQueryParams, SeparationFilterRequest {}

interface SeparationsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface SeparationsListEnvelope {
  success: boolean;
  message: string;
  data: SeparationListItem[];
  errors: Record<string, string[]> | null;
  meta: SeparationsApiPaginationMeta | null;
}

async function listSeparations(
  params: ListSeparationsParams
): Promise<ResponsePagination<SeparationListItem[]>> {
  const { data } = await api.V2.get<SeparationsListEnvelope>('/separations', {
    page: params.page,
    per_page: params.per_page,
    // Filtro único desta entrega (contrato §5) — Lote (`SeparationFilterData.batchUuid`).
    batch_uuid: params.batch_uuid || undefined,
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

async function getSeparationByUuid(uuid: string): Promise<Response<SeparationDetail>> {
  const { data } = await api.V2.get<Response<SeparationDetail>>(`/separations/${uuid}`);
  return data;
}

// `DELETE /separations/{uuid}` — hard delete (contrato §3), sempre
// condicionado no cliente a `!finished_processing` (a UI nunca chama esta
// função quando o registro já foi processado — mirror da mesma disciplina de
// `deleteBirthAnimal`/GAP-NASC-09, aqui sem achado equivalente de servidor
// permissivo documentado, então o gate de UI é a única barreira conhecida).
async function deleteSeparation(uuid: string): Promise<void> {
  await api.V2.delete(`/separations/${uuid}`);
}

// -----------------------------------------------------------------------------
// Consumidos pela Tarefa 25 (formulário criar/editar) — declarados aqui por
// instrução da fundação (contrato §8).
// -----------------------------------------------------------------------------

// Envio COMPLETO sempre (nunca delta de `dirtyFields`, contrato §7.2) —
// `batches` é um `sync()` total no servidor (mirror `SE-update`).
async function createSeparation(
  payload: CreateOrUpdateSeparationRequest
): Promise<Response<SeparationDetail>> {
  const { data } = await api.V2.post<Response<SeparationDetail>>('/separations', payload);
  return data;
}

async function updateSeparation(
  uuid: string,
  payload: CreateOrUpdateSeparationRequest
): Promise<Response<SeparationDetail>> {
  const { data } = await api.V2.put<Response<SeparationDetail>>(`/separations/${uuid}`, payload);
  return data;
}

// `GET /separations/check-date?date=&batch_uuids[]=` — aviso NÃO-BLOQUEANTE
// de consistência de data×lote (contrato §7.4). Aceita MÚLTIPLOS
// `batch_uuids[]` (diferente do precedente Nascimentos, `batch_uuid`
// singular) — a resposta é uma lista `invalid_batches[]`, não um booleano
// único por campo. Falha de rede/servidor não bloqueia o preenchimento nem o
// submit (try/catch silencioso no caller, mirror Nascimentos) —
// `GAP-APART-05` fechou esta decisão como "preservar como-is".
async function checkSeparationDate(params: {
  date: string;
  batch_uuids: string[];
}): Promise<CheckSeparationDateResult> {
  const { data } = await api.V2.get<Response<CheckSeparationDateResult>>(
    '/separations/check-date',
    {
      date: params.date,
      batch_uuids: params.batch_uuids.length > 0 ? params.batch_uuids : undefined,
    }
  );
  return data.data;
}

export {
  checkSeparationDate,
  createSeparation,
  deleteSeparation,
  getSeparationByUuid,
  listSeparations,
  updateSeparation,
};
