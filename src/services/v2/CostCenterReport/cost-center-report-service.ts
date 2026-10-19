// src/services/v2/CostCenterReport/cost-center-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Centro de Custo" (F-247, esteira 97-Esteiras/052,
// TASK-052-247-FE-01). Mirror ESTRUTURAL de
// `Relatorios/cost-calculation-report-service.ts` (`toQuery` compartilhado
// pelos 3 endpoints — 1 Action serve as 3 URIs, mirror `cost-calculation-
// report`, DEC-225 §7.6/DIV-ARQ-01).
//
// Endpoints (contrato de tela SELADO, DEC-225):
//   GET /cost-center-report          → PDF binário (`responseType:'blob'`).
//   GET /cost-center-report/excel    → Excel binário (`responseType:'blob'`).
//   GET /cost-center-report/preview  → JSON, envelope `ApiResponse`
//     (`{title,subtitle,columns,rows,kpis,filters}`, mirror `cost-
//     calculation-report`/`production-area-report`).
//
// `X-Farm-Id` (fazenda ATIVA) vai automaticamente pelo header do client
// (`get_spa_api_client_pattern §2`) — `farm_id` aqui é SÓ o sub-filtro
// OPCIONAL tenant-wide do formulário, nunca um substituto do contexto de
// fazenda ativa. `proprietary` (string, aceito-e-ignorado no server) NUNCA
// entra na querystring — só `proprietary_id` é real (DEC-225 §7.2).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { CostCenterReportParams, CostCenterReportPreview } from '@/@types/v2/CostCenterReport';

// Achata os campos opcionais para a querystring — compartilhado pelas 3
// funções abaixo (mirror `toQuery` de `cost-calculation-report-service.ts`).
function toQuery(params: CostCenterReportParams) {
  return {
    group: params.group,
    start_date: params.start_date,
    end_date: params.end_date,
    accounts: params.accounts?.length ? params.accounts : undefined,
    proprietary_id: params.proprietary_id || undefined,
    center_id: params.center_id || undefined,
    farm_id: params.farm_id || undefined,
  };
}

async function getCostCenterReportPreview(
  params: CostCenterReportParams
): Promise<CostCenterReportPreview> {
  const { data } = await api.V2.get<Response<CostCenterReportPreview>>(
    '/cost-center-report/preview',
    toQuery(params)
  );
  return data.data;
}

async function downloadCostCenterReportPdf(params: CostCenterReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/cost-center-report', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

async function downloadCostCenterReportExcel(params: CostCenterReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/cost-center-report/excel', toQuery(params), {
    responseType: 'blob',
  });
  return data;
}

export { downloadCostCenterReportExcel, downloadCostCenterReportPdf, getCostCenterReportPreview };
