// src/services/v2/InputEntries/input-entry-service.ts
// -----------------------------------------------------------------------------
// InputEntry Service — API v1 do backend Laravel GB.Cerne ("Entrada de
// Insumos"). Casa própria (mirror `invoice-service.ts`), NÃO sub-pasta de
// CadastrosBase. Esteira 037, TASK-IE-FE-04.
//
// Contrato REAL (`routes/api.php:1079-1084`, InputEntryController já
// migrado):
//   GET    /input-entries           → paginado, SEM `items` (listagem enxuta)
//   GET    /input-entries/{uuid}    → detalhe completo (`items` eager-loaded)
//   POST   /input-entries           → cabeçalho + items[] + baixa financeira
//                                       automática condicional
//   PUT    /input-entries/{uuid}    → payload COMPLETO (reverte+recria itens,
//                                       NÃO é PATCH parcial)
//   DELETE /input-entries/{uuid}    → reverte estoque, tenta excluir
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  InputEntriesListEnvelope,
  InputEntryAppropriationTypeOption,
  InputEntryDetail,
  InputEntryListItem,
  InputEntryPayload,
} from '@/@types/v2/InputEntries';

export interface ListInputEntriesParams extends PaginationQueryParams {
  /** Nome do campo é `proprietary_id` (mirror legado), mas o VALOR é `uuid`. */
  proprietary_id?: string;
  start_date?: string;
  end_date?: string;
}

async function listInputEntries(
  params: ListInputEntriesParams
): Promise<ResponsePagination<InputEntryListItem[]>> {
  const { data } = await api.V2.get<InputEntriesListEnvelope>('/input-entries', {
    page: params.page,
    per_page: params.per_page,
    proprietary_id: params.proprietary_id || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid).
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

async function getInputEntry(inputEntryUuid: string) {
  const { data } = await api.V2.get<Response<InputEntryDetail>>(`/input-entries/${inputEntryUuid}`);
  return data;
}

async function createInputEntry(payload: InputEntryPayload) {
  const { data } = await api.V2.post<Response<InputEntryDetail>>('/input-entries', payload);
  return data;
}

// PUT — payload SEMPRE completo (mirror `updateInvoice`, reverte+recria
// itens no servidor, sem PATCH parcial de 1 linha).
async function updateInputEntry(inputEntryUuid: string, payload: InputEntryPayload) {
  const { data } = await api.V2.put<Response<InputEntryDetail>>(
    `/input-entries/${inputEntryUuid}`,
    payload
  );
  return data;
}

async function deleteInputEntry(inputEntryUuid: string) {
  const { data } = await api.V2.delete(`/input-entries/${inputEntryUuid}`);
  return data;
}

// TASK-BE-1085 (GAP-BE-684, F-084 Entrada/Insumos item 3) — `GET
// /input-entries/appropriation-types/options`, lookup enxuto de
// elegibilidade de Tipo de Apropriação (Agricultura/Pecuária) por Centro de
// Custo HABILITADO do tenant corrente. `permission:input_entries_view`
// (mesmo gate de index/show), envelope FLAT (`data` é o array direto, `meta`
// sempre `null`) — mirror EXATO `listAppropriationTypeOptions`
// (`services/v2/Invoices/invoice-service.ts`).
async function listInputEntryAppropriationTypeOptions(): Promise<
  Response<InputEntryAppropriationTypeOption[]>
> {
  const { data } = await api.V2.get<Response<InputEntryAppropriationTypeOption[]>>(
    '/input-entries/appropriation-types/options'
  );
  return data;
}

export {
  createInputEntry,
  deleteInputEntry,
  getInputEntry,
  listInputEntries,
  listInputEntryAppropriationTypeOptions,
  updateInputEntry,
};
