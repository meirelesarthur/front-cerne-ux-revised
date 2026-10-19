// src/services/v2/MovementSheets/movement-sheet-service.ts
// -----------------------------------------------------------------------------
// Movement Sheet Service — API v1 do backend Laravel GB.Cerne (Importação
// Mov. Bancários, Financeiro, F-112, 97-Esteiras/064).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET  /movement-sheets          → data: MovementSheetListItem[] + meta de
//                                     paginação CONFIGURÁVEL (`MovementSheetIndexRequest`:
//                                     per_page sometimes|integer|min:1|max:100,
//                                     default 10 no `MovementSheetFilterData` do backend)
//   GET  /movement-sheets/{uuid}   → data: MovementSheetDetail (TASK-064-MOV-FE-03)
//   GET  /movement-sheets/download → binário .xlsx (TASK-064-MOV-FE-02)
//   POST /movement-sheets/import   → multipart `file` (TASK-064-MOV-FE-02)
//
// `listMovementSheets` ADAPTA o envelope paginado do backend ({ data: [],
// meta: {} }) para o shape `ResponsePagination` ({ data: { items, pagination
// } }) que a infra de grid do projeto (useCustomGridQuery/TableProvider)
// consome — mirror `listStockCorrections`.
//
// ⚠️ Diferente de `listStockCorrections`: `per_page` é ENVIADO normalmente
// (a API de movement-sheets aceita e pagina de acordo — confirmado por
// leitura direta de `MovementSheetIndexRequest`/`MovementSheetFilterData` no
// backend, `per_page` default 10/max 100). Não há aqui a exceção fixa-15 de
// StockCorrection.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  MovementSheetDetail,
  MovementSheetImportResult,
  MovementSheetListItem,
  MovementSheetsListEnvelope,
} from '@/@types/v2/MovementSheets';

// Params aceitos pela listagem — `page`/`per_page` repassados normalmente
// (ver nota de cabeçalho acima).
export interface ListMovementSheetsParams extends PaginationQueryParams {
  start_date?: string;
  end_date?: string;
}

async function listMovementSheets(
  params: ListMovementSheetsParams
): Promise<ResponsePagination<MovementSheetListItem[]>> {
  const { data } = await api.V2.get<MovementSheetsListEnvelope>('/movement-sheets', {
    page: params.page,
    per_page: params.per_page,
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
        per_page: data.meta?.per_page ?? params.per_page ?? 10,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// ---- TASK-064-MOV-FE-03: detalhe read-only --------------------------------
// `MovementSheetResource` (mesmo Resource da listagem) não amplia campos no
// show — mirror `getStockCorrection`.

async function getMovementSheet(movementSheetUuid: string): Promise<Response<MovementSheetDetail>> {
  const { data } = await api.V2.get<Response<MovementSheetDetail>>(
    `/movement-sheets/${movementSheetUuid}`
  );
  return data;
}

// ---- Import de planilha (.xlsx/.xls) — ABORT-ALL (TASK-064-MOV-FE-02) ------
// Exceção ao envelope ApiResponse (resposta binária) — `responseType: 'blob'`,
// mirror `downloadStockCorrectionImportTemplate`/`downloadRainfallTemplate`.

async function downloadMovementSheetTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/movement-sheets/download', undefined, {
    responseType: 'blob',
  });
  return data;
}

// `POST /movement-sheets/import` — multipart, campo `file`. Sucesso (200):
// envelope `Response<MovementSheetImportResult>` (`{imported, movementSheet}`).
// Erro 422 (ABORT-ALL, `ImportMovementSheetAction` Fase 1 — confirmado por
// leitura direta do backend/testes, `ValidationException::withMessages(['row.N'
// => [mensagem]])`): `errors` flat por linha, chave `row.<N>` (NÃO
// `errors.rows: string[]` — shape distinto do que o roteiro havia
// sinalizado como "a confirmar"; o parsing em
// `MovementSheetImportModal.onError` monta a lista de exibição a partir
// dessas chaves `row.*`), zero persistência.
async function importMovementSheets(file: File): Promise<Response<MovementSheetImportResult>> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.V2.post<Response<MovementSheetImportResult>>(
    '/movement-sheets/import',
    fd
  );
  return data;
}

export {
  downloadMovementSheetTemplate,
  getMovementSheet,
  importMovementSheets,
  listMovementSheets,
};
