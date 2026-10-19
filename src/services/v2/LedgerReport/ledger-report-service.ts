// src/services/v2/LedgerReport/ledger-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Livro Razão" (F-274, 97-Esteiras/008, TASK-FE-LR-01). Mirror
// ESTRUTURAL de `CostCenterReport/cost-center-report-service.ts` (`toQuery`
// compartilhado pelas 3 funções — 1 Action serve as 3 URIs).
//
// Endpoints (contrato de wire fechado, TASK-FE-LR-01 §1):
//   GET /ledger-report          → PDF binário (`responseType:'blob'`).
//   GET /ledger-report/excel    → Excel binário (`responseType:'blob'`).
//   GET /ledger-report/preview  → JSON, envelope `ApiResponse`
//     (`{title,subtitle,emittedAt,columns,rows,kpis,filters}`).
//
// `X-Farm-Id` (fazenda ATIVA) vai automaticamente pelo header do client
// (`get_spa_api_client_pattern §2`) — NÃO existe param `farm_id` nesta tela;
// `type` do legado NÃO é portado (a URI é o seletor de formato).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { LedgerReportParams, LedgerReportPreview } from '@/@types/v2/LedgerReport';

// Achata os campos opcionais para a querystring — compartilhado pelas 3
// funções abaixo. Todo opcional em branco vira `undefined` (nunca `''`),
// evitando 422 do servidor (`sometimes` + `uuid`).
function toQuery(params: LedgerReportParams) {
  return {
    account_uuid: params.account_uuid,
    start_date: params.start_date,
    end_date: params.end_date,
    condition: params.condition || undefined,
    proprietary_uuid: params.proprietary_uuid || undefined,
    cost_center_uuid: params.cost_center_uuid || undefined,
    plan_account_uuid: params.plan_account_uuid || undefined,
    category_uuids: params.category_uuids?.length ? params.category_uuids : undefined,
  };
}

async function getLedgerReportPreview(params: LedgerReportParams): Promise<LedgerReportPreview> {
  const { data } = await api.V2.get<Response<LedgerReportPreview>>(
    '/ledger-report/preview',
    toQuery(params)
  );
  return data.data;
}

async function downloadLedgerReportPdf(params: LedgerReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/ledger-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function downloadLedgerReportExcel(params: LedgerReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/ledger-report/excel', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

export { downloadLedgerReportExcel, downloadLedgerReportPdf, getLedgerReportPreview };
