// src/services/v2/RequestPurchaseManagementReport/request-purchase-management-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Gerencial de Solicitações" (F-310, `RequestPurchaseManagement-
// ReportController`, esteira 97-Esteiras/053, TASK-053-F310-FE-01). Mirror
// ESTRUTURAL de `cost-center-report-service.ts` (`toQuery` compartilhado
// pelas 2 rotas de download — 1 Action orquestradora serve os 2 formatos,
// sem recálculo) + `management-batch-report-service.ts` (`/options`
// combinado, farms+types+statuses num único `useQuery`).
//
// Endpoints confirmados por leitura DIRETA de
// `GB.Cerne.Api/app/Http/Controllers/Api/V1/RequestPurchaseManagementReportController.php`
// e `routes/api.php:4945-4959` (branch `feature/053-relatorios`, commit
// `46c5021a6`):
//   GET /request-purchases/management-report          → PDF binário
//     (`responseType:'blob'`).
//   GET /request-purchases/management-report/excel     → Excel binário
//     (`responseType:'blob'`).
//   GET /request-purchases/management-report/options   → envelope
//     `ApiResponse`, `data.farms`/`data.types`/`data.statuses`.
//
// `X-Farm-Id` (fazenda ATIVA) vai automaticamente pelo header do client
// (`get_spa_api_client_pattern §2`) — `farm_id` aqui é SÓ o sub-filtro
// OPCIONAL tenant-wide do formulário, nunca um substituto do contexto de
// fazenda ativa.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  RequestPurchaseManagementReportOptionsData,
  RequestPurchaseManagementReportParams,
} from '@/@types/v2/RequestPurchaseManagementReport';

// Achata os campos opcionais para a querystring — compartilhado pelas 2
// funções de download abaixo (mirror `toQuery` de
// `cost-center-report-service.ts`).
function toQuery(params: RequestPurchaseManagementReportParams) {
  return {
    start_date: params.start_date,
    end_date: params.end_date,
    farm_id: params.farm_id || undefined,
    type_request: params.type_request || undefined,
    status: params.status ?? undefined,
  };
}

async function getRequestPurchaseManagementReportOptions(): Promise<RequestPurchaseManagementReportOptionsData> {
  const { data } = await api.V2.get<Response<RequestPurchaseManagementReportOptionsData>>(
    '/request-purchases/management-report/options'
  );
  return data.data;
}

async function downloadRequestPurchaseManagementReportPdf(
  params: RequestPurchaseManagementReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/request-purchases/management-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function downloadRequestPurchaseManagementReportExcel(
  params: RequestPurchaseManagementReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/request-purchases/management-report/excel',
    toQuery(params),
    { responseType: 'blob' }
  );
  return data;
}

export {
  downloadRequestPurchaseManagementReportExcel,
  downloadRequestPurchaseManagementReportPdf,
  getRequestPurchaseManagementReportOptions,
};
