// src/services/v2/Relatorios/costing-grazing-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Custeio/Módulo" (F-250, TASK-CM-FE-01, esteira 080). Mirror
// ESTRUTURAL de `Relatorios/costing-batch-report-service.ts` (1 função
// interna + 2 wrappers) — resposta BINÁRIA (PDF ou Excel conforme
// `report_type`), `responseType: 'blob'` obrigatório (inclusive erro 422,
// que chega como `Blob` e precisa de `parseBlobError` no `catch` da tela).
//
// `report_type` (D2, contrato de tela §6) — NOME do parâmetro enviado ao
// backend, NÃO `type` (nome usado pelos 2 mirrors mais próximos) e NÃO
// truthiness: a UI continua sendo 2 botões distintos, cada um fixando o
// valor internamente (`'pdf' | 'excel'`), sem nenhum `<select>` no DOM.
//
// Endpoint: `GET /api/v1/costing-grazing-report` (contrato de tela
// `Custeio-Modulo-Contrato-Front.md` §6, contrato de API
// `Custeio-Modulo-Contrato-API.md`). Envelope `{success,message,data,errors,
// meta}` NÃO se aplica — mesma exceção documentada para controllers de
// relatório binário (`get_spa_api_client_pattern`).
//
// `CostingGrazingReportParams` fica INLINE neste arquivo de service (NÃO em
// `@types/v2/Relatorios/`) — convenção REAL já em uso pelos 2 mirrors mais
// próximos (`costing-batch-report-service.ts`/`costing-animal-report-
// service.ts`), nenhum dos 2 tem arquivo `@types` próprio (contrato de tela
// §6).
//
// SEM `X-Farm-Id` manual no payload — a fazenda ativa vai pelo header
// automático do client (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface CostingGrazingReportParams {
  grazings?: string[];
  start_date: string;
  end_date: string;
}

async function downloadCostingGrazingReport(
  params: CostingGrazingReportParams,
  reportType: 'pdf' | 'excel'
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/costing-grazing-report',
    {
      grazings: params.grazings?.length ? params.grazings : undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      report_type: reportType, // D2 — nome NOVO, não `type` (mirror do contrato de API §5)
    },
    { responseType: 'blob' }
  );
  return data;
}

async function downloadCostingGrazingReportPdf(params: CostingGrazingReportParams): Promise<Blob> {
  return downloadCostingGrazingReport(params, 'pdf');
}

async function downloadCostingGrazingReportXlsx(params: CostingGrazingReportParams): Promise<Blob> {
  return downloadCostingGrazingReport(params, 'excel');
}

export { downloadCostingGrazingReportPdf, downloadCostingGrazingReportXlsx };
