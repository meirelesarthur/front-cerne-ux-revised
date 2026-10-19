// src/services/v2/Relatorios/stock-movement-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Movimentação de Estoque" (F-1f1d23e3, TASK-MOV-FE-01, esteira
// 074). Mirror ESTRUTURAL de `cost-calculation-report-service.ts` (`toQuery`
// compartilhado pelos binários), MENOS a prévia — esta feature não tem
// endpoint `/preview` (mirror front §4).
//
// Endpoints (contrato de tela §4 / contrato API §PASSO 5):
//   GET /stock-movement-report        (PDF, `responseType: 'blob'`)
//   GET /stock-movement-report/export (Excel, `responseType: 'blob'`)
//
// Envelope `{success,message,data,errors,meta}` NÃO se aplica aos 2
// binários — mesma exceção documentada de `cost-calculation-report-service.ts`
// / `paid-interest-report-service.ts`.
//
// SEM `farm_id`/`X-Farm-Id` no payload — a fazenda ativa vai pelo header
// `X-Farm-Id` automático do client (`get_spa_api_client_pattern §2`);
// `warehouse_uuid` é validado server-side contra a fazenda ativa (contrato
// API §PASSO 3, `Rule::exists('warehouses','uuid')->where('farm_id',$farmId)`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface StockMovementReportParams {
  warehouse_uuid: string;
  start_date?: string;
  end_date?: string;
  product_uuids?: string[];
}

function toQuery(params: StockMovementReportParams) {
  return {
    warehouse_uuid: params.warehouse_uuid,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
    product_uuids: params.product_uuids?.length ? params.product_uuids : undefined,
  };
}

async function downloadStockMovementReportPdf(params: StockMovementReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/stock-movement-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function downloadStockMovementReportExcel(params: StockMovementReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/stock-movement-report/export', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

export { downloadStockMovementReportExcel, downloadStockMovementReportPdf };
