// src/services/v2/Fiscal/CashBook/cash-book-service.ts
// -----------------------------------------------------------------------------
// CashBook Service — API v1 do backend Laravel GB.Cerne (LCDPR — Livro Caixa
// Digital do Produtor Rural, domínio Fiscal, execução 045, TASK-LCDPR-FE-01).
// Contrato: `CONTRATO-API-LCDPR.md`, conferido contra o código-fonte REAL do
// backend já implementado (`GB.Cerne.Api/app/Http/Controllers/Api/V1/
// CashBookController.php` + `Resources/V1/CashBook*Resource.php`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /cash-books                → data: CashBookListItem[] + meta REAL
//                                        de paginação, ordenado `year desc`.
//   POST   /cash-books                → payload CreateCashBookRequest (8
//                                        campos); 201 CashBookResource.
//   GET    /cash-books/{uuid}         → CashBookDetailResource (metadados +
//                                        resumo mensal opcional).
//   DELETE /cash-books/{uuid}         → 204.
//   GET    /cash-books/{uuid}/report  → binário application/pdf.
//   GET    /cash-books/{uuid}/txt     → binário text/plain.
//
// `listCashBooks` ADAPTA o envelope paginado do backend para o shape
// `ResponsePagination` que a infra de grid do projeto (useCustomGridQuery)
// consome — mesmo adaptador de `listContadores`/`listProprietaries`.
//
// `report`/`txt` NÃO passam pelo envelope `ApiResponse` (binário puro com
// `Content-Type`/`Content-Disposition` próprios, conferido no Controller
// real) — `responseType: 'blob'`, mirror
// `src/pages/Administrativo/SaldoEstoque/SaldoEstoqueRelatorio.tsx`.
// `downloadBlob()` sempre usa o `filename` passado pelo CHAMADOR (nunca lê
// `Content-Disposition` — ver `src/utils/downloadBlob.ts`), então o nome de
// arquivo é resolvido no consumidor a partir dos dados já em mãos
// (`CashBookDetailData.filename` no Detalhe; `livro-caixa-{year}.*` como
// fallback na Listagem, que não recebe `filename` no payload enxuto de
// `CashBookListResource`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CashBookData,
  CashBookDetailData,
  CashBookListItem,
  CreateCashBookRequest,
} from '@/@types/v2/Fiscal/cashBook';

// Filtros aditivos do index (`year`/`proprietary_id`, ambos opcionais — o
// legado não tinha filtro nenhum aqui, `CashBookFilterData` do backend).
export interface ListCashBooksParams extends PaginationQueryParams {
  year?: number;
  proprietary_id?: string;
}

interface CashBooksListEnvelope {
  success: boolean;
  message?: string;
  data: CashBookListItem[];
  meta?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

async function listCashBooks(
  params: ListCashBooksParams
): Promise<ResponsePagination<CashBookListItem[]>> {
  const { data } = await api.V2.get<CashBooksListEnvelope>('/cash-books', {
    page: params.page,
    per_page: params.per_page,
    year: params.year || undefined,
    proprietary_id: params.proprietary_id || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de listContadores/listProprietaries.
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

async function getCashBook(uuid: string) {
  const { data } = await api.V2.get<Response<CashBookDetailData>>(`/cash-books/${uuid}`);
  return data;
}

async function createCashBook(payload: CreateCashBookRequest) {
  const { data } = await api.V2.post<Response<CashBookData>>('/cash-books', payload);
  return data;
}

async function deleteCashBook(uuid: string) {
  const { data } = await api.V2.delete(`/cash-books/${uuid}`);
  return data;
}

// ---- Downloads (binário puro, SEM envelope ApiResponse) --------------------

async function downloadCashBookTxt(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/cash-books/${uuid}/txt`, undefined, {
    responseType: 'blob',
  });
  return data;
}

async function downloadCashBookReport(uuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`/cash-books/${uuid}/report`, undefined, {
    responseType: 'blob',
  });
  return data;
}

export {
  createCashBook,
  deleteCashBook,
  downloadCashBookReport,
  downloadCashBookTxt,
  getCashBook,
  listCashBooks,
};
