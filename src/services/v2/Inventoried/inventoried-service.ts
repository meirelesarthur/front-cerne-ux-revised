// src/services/v2/Inventoried/inventoried-service.ts
// -----------------------------------------------------------------------------
// Inventoried Service — API v1 do backend Laravel GB.Cerne (Inventariado,
// Operacional → Pecuária). F-041, execução CORE_WORKSPACE/97-Esteiras/060.
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /inventoried-animals            → data: InventoriedListItem[] + meta de paginação (FIXO 10/página — `paginate(10)` no Repository)
//   GET    /inventoried-animals/{uuid}     → data: InventoriedDetail
//   DELETE /inventoried-animals/{uuid}     → 204 (hard delete transacional, cascade no pivot)
//   GET    /inventoried-animals/download   → binário .xlsx (template, 3 abas)
//   POST   /inventoried-animals/import     → multipart `file`; sucesso (201): InventoriedDetail; 422: errors.rows: string[]
//   GET    /inventoried-animals/{uuid}/report → binário PDF
//
// `listInventoried` ADAPTA o envelope paginado do backend ({ data: [], meta:
// {} }) para o shape `ResponsePagination` ({ data: { items, pagination } })
// que a infra de grid do projeto (useCustomGridQuery/TableProvider) consome —
// mirror `listStockCorrections`.
//
// `per_page` NUNCA é enviado — o backend fixa 10/página
// (`InventoriedRepository::listPaginated` usa `paginate(10)`, contrato de
// fatia §2/E1). Enviar não quebraria nada, mas fabricaria uma capacidade que
// a UI não tem — a paginação client-side continua funcionando via
// `page`/`meta.last_page`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  InventoriedDetail,
  InventoriedImportResult,
  InventoriedListEnvelope,
  InventoriedListItem,
} from '@/@types/v2/Inventoried';

// `page` continua aceito (paginação client-side via `meta.last_page`);
// `per_page` do `PaginationQueryParams` NUNCA é repassado à API (ver nota de
// cabeçalho acima).
export interface ListInventoriedParams extends PaginationQueryParams {}

async function listInventoried(
  params: ListInventoriedParams
): Promise<ResponsePagination<InventoriedListItem[]>> {
  const { data } = await api.V2.get<InventoriedListEnvelope>('/inventoried-animals', {
    page: params.page,
    // NÃO enviar `per_page` — o backend ignora, ver nota de cabeçalho.
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

async function getInventoried(inventoriedUuid: string): Promise<Response<InventoriedDetail>> {
  const { data } = await api.V2.get<Response<InventoriedDetail>>(
    `/inventoried-animals/${inventoriedUuid}`
  );
  return data;
}

async function deleteInventoried(inventoriedUuid: string) {
  const { data } = await api.V2.delete(`/inventoried-animals/${inventoriedUuid}`);
  return data;
}

// Exceção ao envelope ApiResponse (resposta binária) — `responseType: 'blob'`,
// mirror `downloadStockCorrectionImportTemplate`.
async function downloadInventoriedTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/inventoried-animals/download', undefined, {
    responseType: 'blob',
  });
  return data;
}

// `POST /inventoried-animals/import` — multipart, campo `file`. Sucesso
// (201): envelope `Response<InventoriedImportResult>` (mesmo shape do
// detalhe). Erro 422: `errors.rows: string[]` (mensagens literais por linha,
// padrão ABORT-ALL, nada persistido) — tratamento diferenciado fica na
// mutation do `InventariadoImportModal.tsx` (NÃO usa `useRequest` genérico,
// mirror `StockCorrectionImportModal.tsx`).
async function importInventoried(file: File): Promise<Response<InventoriedImportResult>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<InventoriedImportResult>>(
    '/inventoried-animals/import',
    fd
  );
  return data;
}

// GET /inventoried-animals/{uuid}/report — PDF individual, `responseType:
// 'blob'`, sem envelope.
async function downloadInventoriedReport(inventoriedUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    `/inventoried-animals/${inventoriedUuid}/report`,
    undefined,
    {
      responseType: 'blob',
    }
  );
  return data;
}

export {
  deleteInventoried,
  downloadInventoriedReport,
  downloadInventoriedTemplate,
  getInventoried,
  importInventoried,
  listInventoried,
};
