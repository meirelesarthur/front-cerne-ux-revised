// src/services/v2/RequestPurchaseForecastReport/request-purchase-forecast-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Produtos x Prev. Entrega" (F-309,
// `RequestPurchaseForecastReportController`, esteira 97-Esteiras/058,
// TASK-058-F309-FE-01). Mirror ESTRUTURAL de
// `request-purchase-management-report-service.ts` (F-310): `toQuery`
// compartilhado pelas 2 rotas de download (1 Action orquestradora serve os 2
// formatos, sem recálculo) + `/options` combinado (farms+users+statuses+
// priorities+authorizers num único `useQuery`).
//
// Endpoints (plano de API F-309, rotas JÁ WIREADAS pelo backend):
//   GET /request-purchases/forecast-report          → PDF binário
//     (`responseType:'blob'`).
//   GET /request-purchases/forecast-report/excel     → Excel binário
//     (`responseType:'blob'`).
//   GET /request-purchases/forecast-report/options   → envelope
//     `ApiResponse`, `data.farms`/`data.users`/`data.statuses`/
//     `data.priorities`/`data.authorizers`.
//
// `product` NÃO faz parte deste `/options` combinado — resolvido à parte via
// `listProductOptions` (`@/services/v2/Products/product-service`, endpoint
// `/products/options`, escopo TENANT, mirror C3 do contrato legado). `status`/
// `priority` usam `?? undefined` (NUNCA `||`) em `toQuery` — `0` ("Alta"/
// status inicial) é um valor VÁLIDO e `0 || undefined` apagaria o filtro
// (risco #3 do plano, mirror `request-purchase-management-report-service.ts`).
//
// `X-Farm-Id` (fazenda ATIVA) vai automaticamente pelo header do client
// (`get_spa_api_client_pattern §2`) — `farm_id` aqui é SÓ o sub-filtro
// OPCIONAL tenant-wide do formulário, nunca um substituto do contexto de
// fazenda ativa.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  RequestPurchaseForecastReportOptionsData,
  RequestPurchaseForecastReportParams,
} from '@/@types/v2/RequestPurchaseForecastReport';

// Achata os campos opcionais para a querystring — compartilhado pelas 2
// funções de download abaixo (mirror `toQuery` de
// `request-purchase-management-report-service.ts`).
function toQuery(params: RequestPurchaseForecastReportParams) {
  return {
    start_date: params.start_date,
    end_date: params.end_date,
    farm_id: params.farm_id || undefined,
    user_id: params.user_id || undefined,
    status: params.status ?? undefined,
    priority: params.priority ?? undefined,
    authorizer_id: params.authorizer_id || undefined,
    number: params.number || undefined,
    product: params.product || undefined,
    service: params.service || undefined,
  };
}

async function getRequestPurchaseForecastReportOptions(): Promise<RequestPurchaseForecastReportOptionsData> {
  const { data } = await api.V2.get<Response<RequestPurchaseForecastReportOptionsData>>(
    '/request-purchases/forecast-report/options'
  );
  return data.data;
}

async function downloadRequestPurchaseForecastReportPdf(
  params: RequestPurchaseForecastReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/request-purchases/forecast-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function downloadRequestPurchaseForecastReportExcel(
  params: RequestPurchaseForecastReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/request-purchases/forecast-report/excel',
    toQuery(params),
    { responseType: 'blob' }
  );
  return data;
}

export {
  downloadRequestPurchaseForecastReportExcel,
  downloadRequestPurchaseForecastReportPdf,
  getRequestPurchaseForecastReportOptions,
};
