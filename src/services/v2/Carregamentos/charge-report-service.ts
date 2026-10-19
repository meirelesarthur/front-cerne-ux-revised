// src/services/v2/Carregamentos/charge-report-service.ts
// -----------------------------------------------------------------------------
// Serviço dos 2 relatórios PDF de Carregamentos (por produto/semanal),
// TASK-FE-CG-07 — mirror `Weaning/weaning-service.ts` §`report` (download
// SÍNCRONO via blob, `responseType: 'blob'`, sem Job/polling — decisão b do
// dono já fechada na camada `api`, `ChargeReportController`/`DomPDF::stream()`).
//
// Casa PRÓPRIA (não o mesmo arquivo de `charge-service.ts`) — mirror da
// separação já aplicada no backend (`ChargeReportController` dedicado,
// separado de `ChargeController`).
//
// `GET /charges/report-by-product` (`charge_product_report`) e
// `GET /charges/week-report` (`charge_week_report`) — 2 permissões
// DIFERENTES, mesmo shape de parâmetro (`ChargeReportRequest::rules()`,
// `start_date`/`end_date` ambos `required|date`, `end_date >=
// start_date`). `X-Farm-Id` anexado automaticamente pelo interceptor
// genérico de `@/services/api.ts`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { ChargeReportParams } from '@/@types/v2/Carregamentos';

async function downloadChargeReportByProduct(params: ChargeReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/charges/report-by-product',
    { start_date: params.start_date, end_date: params.end_date },
    { responseType: 'blob' }
  );
  return data;
}

async function downloadChargeWeekReport(params: ChargeReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/charges/week-report',
    { start_date: params.start_date, end_date: params.end_date },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadChargeReportByProduct, downloadChargeWeekReport };
