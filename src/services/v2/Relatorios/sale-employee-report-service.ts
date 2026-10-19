// src/services/v2/Relatorios/sale-employee-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Vendas/Funcionário" (F-314, `SaleEmployeeReportController`,
// esteira CORE_WORKSPACE/97-Esteiras/079) — mirror EXATO de
// `sale-product-report-service.ts` (F-315): 1 função de download síncrono,
// resposta BINÁRIA (PDF ou XLSX conforme `type`), `responseType: 'blob'`
// obrigatório (sem isso o axios corrompe o binário).
//
// Endpoint confirmado por leitura DIRETA de `GB.Cerne.Api/routes/api.php:4037`
// (`Route::get('sales-employee-report', SaleEmployeeReportController::class)
// ->name('sale-employees.report')`) — SEM envelope `{success,message,data,
// errors,meta}` (mesma exceção documentada em `sale-product-report-service.ts`
// para controllers de relatório binário; motor antigo, sem `<x-gb-report>`).
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
//
// LOOKUP `user_uuid` — `GET /users/options`, mirror EXATO de
// `listServiceOrderExecutorOptions` (`@/services/v2/ServiceOrders/
// service-order-service.ts`), precedente já em produção do MESMO endpoint.
// Nenhum parâmetro de fazenda explícito — o interceptor global já propaga
// `X-Farm-Id`, e é esse header que o `SaleReportRequest::rules()['user_uuid']`
// usa para validar pertencimento à fazenda ativa (contrato §4 do plano).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { SaleEmployeeReportParams } from '@/@types/v2/Relatorios/sale-employee-report';

async function downloadSaleEmployeeReport(params: SaleEmployeeReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/sales-employee-report',
    {
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      user_uuid: params.user_uuid || undefined,
      type: params.type,
    },
    { responseType: 'blob' }
  );
  return data;
}

/** `GET /users/options` — lookup do select "Funcionário". Mirror
 * `ServiceOrderExecutorOption`/`listServiceOrderExecutorOptions`. */
export interface SaleEmployeeReportUserOption {
  uuid: string;
  name: string | null;
}

interface SaleEmployeeReportUserOptionsEnvelope {
  success: boolean;
  message: string;
  data: SaleEmployeeReportUserOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}

export interface ListSaleEmployeeReportUserOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listSaleEmployeeReportUserOptions(
  params: ListSaleEmployeeReportUserOptionsParams
): Promise<ResponsePagination<SaleEmployeeReportUserOption[]>> {
  const { data } = await api.V2.get<SaleEmployeeReportUserOptionsEnvelope>('/users/options', {
    search: params.search || undefined,
  });

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

export { downloadSaleEmployeeReport, listSaleEmployeeReportUserOptions };
