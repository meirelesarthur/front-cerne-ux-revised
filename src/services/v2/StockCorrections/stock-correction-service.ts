// src/services/v2/StockCorrections/stock-correction-service.ts
// -----------------------------------------------------------------------------
// Stock Correction Service — API v1 do backend Laravel GB.Cerne (Correção de
// Estoque, Administrativo → Estoque).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /stock-corrections                 → data: StockCorrectionListItem[] + meta de paginação (FIXO 15/página — `->paginate()` sem argumento no Repository, `per_page` é IGNORADO pelo backend)
//   GET    /stock-corrections/{uuid}          → data: StockCorrectionDetail (TASK-FE-COR-02)
//   DELETE /stock-corrections/{uuid}          → 204 (reverte saldo + recalcula custo médio da fazenda inteira)
//   GET    /stock-corrections/import/template → binário (.xlsx em branco)
//   POST   /stock-corrections/import          → multipart `file` (único ponto de criação)
//
// `listStockCorrections` ADAPTA o envelope paginado do backend ({ data: [],
// meta: {} }) para o shape `ResponsePagination` ({ data: { items, pagination
// } }) que a infra de grid do projeto (useCustomGridQuery/TableProvider)
// consome — mirror `listPlanAccounts`.
//
// ⚠️ Diferente de `listPlanAccounts`: `per_page` NUNCA é incluído no objeto de
// params enviado à API (o backend ignora — `StockCorrectionRepository::
// listPaginated` usa `->paginate()` sem argumento, fixo em 15/página,
// confirmado por leitura direta do contrato de API §3.3). Enviar não
// quebraria nada, mas fabricaria uma capacidade que a UI não tem — a
// paginação client-side continua funcionando via `page`/`meta.last_page`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  StockCorrectionDetail,
  StockCorrectionImportResult,
  StockCorrectionListItem,
  StockCorrectionsListEnvelope,
} from '@/@types/v2/StockCorrections';

// Params aceitos pela listagem — `page` continua aceito (paginação
// client-side via `meta.last_page`); `per_page` do `PaginationQueryParams`
// NUNCA é repassado à API (ver nota de cabeçalho acima).
export interface ListStockCorrectionsParams extends PaginationQueryParams {
  start_date?: string;
  end_date?: string;
}

async function listStockCorrections(
  params: ListStockCorrectionsParams
): Promise<ResponsePagination<StockCorrectionListItem[]>> {
  const { data } = await api.V2.get<StockCorrectionsListEnvelope>('/stock-corrections', {
    page: params.page,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
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

async function deleteStockCorrection(stockCorrectionUuid: string) {
  const { data } = await api.V2.delete(`/stock-corrections/${stockCorrectionUuid}`);
  return data;
}

// ---- TASK-FE-COR-02: detalhe read-only ------------------------------------

async function getStockCorrection(
  stockCorrectionUuid: string
): Promise<Response<StockCorrectionDetail>> {
  const { data } = await api.V2.get<Response<StockCorrectionDetail>>(
    `/stock-corrections/${stockCorrectionUuid}`
  );
  return data;
}

// ---- Import de planilha (.xlsx) -------------------------------------------
// Exceção ao envelope ApiResponse (resposta binária) — `responseType: 'blob'`,
// mirror `downloadPlanAccountImportTemplate`.

async function downloadStockCorrectionImportTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/stock-corrections/import/template', undefined, {
    responseType: 'blob',
  });
  return data;
}

// `POST /stock-corrections/import` — multipart, campo `file`. Sucesso (201):
// envelope `Response<StockCorrectionImportResult>` enxuto (`{code,
// rows_processed}`). Erro 422: `errors.rows: string[]` (linhas inválidas,
// fail-fast, nada persistido) OU `message` única (sem contexto de fazenda/
// permissão/arquivo inválido) — tratamento diferenciado fica na mutation do
// `StockCorrectionImportModal.tsx` (NÃO usa `useRequest` genérico, mirror
// `PlanAccountImportModal.tsx`).
async function importStockCorrections(file: File): Promise<Response<StockCorrectionImportResult>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<StockCorrectionImportResult>>(
    '/stock-corrections/import',
    fd
  );
  return data;
}

export {
  deleteStockCorrection,
  downloadStockCorrectionImportTemplate,
  getStockCorrection,
  importStockCorrections,
  listStockCorrections,
};
