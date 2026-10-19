// src/services/v2/Relatorios/feedlot-weighing-performance-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Desempenho Pesagem Confinamento" (F-263, lote 076,
// `FeedlotWeighingPerformanceReport-contrato-api.md` §1/§6) — mirror
// ESTRUTURAL EXATO de `FiscalDifferenceReport/fiscal-difference-report-service.ts`
// (1 função interna + 2 wrappers PDF/Excel, resposta BINÁRIA,
// `responseType:'blob'` obrigatório, inclusive erro 422 que chega como
// `Blob` e precisa de `parseBlobError` no `catch` da tela).
//
// Endpoint: `GET /api/v1/feedlot-weighing-performance-report`
// (`app/Http/Requests/Api/V1/FeedlotWeighingPerformanceReportRequest.php`,
// lido diretamente). Envelope `{success,message,data,errors,meta}` NÃO se
// aplica ao sucesso — mesma exceção documentada nos irmãos de download
// binário (`get_spa_api_client_pattern`).
//
// `report_type` vai como STRING `'pdf'`/`'excel'` (contrato §2 —
// `FeedlotWeighingPerformanceReportOutputType`, nome do campo MANTIDO do
// legado `report_type`, valores viram enum `pdf`/`excel`).
//
// SEM `X-Farm-Id` manual no payload — a fazenda ativa vai pelo header
// automático do client (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type {
  FeedlotWeighingPerformanceReportOutputType,
  FeedlotWeighingPerformanceReportParams,
} from '@/@types/v2/Relatorios/feedlot-weighing-performance-report';

async function downloadFeedlotWeighingPerformanceReport(
  params: FeedlotWeighingPerformanceReportParams,
  reportType: FeedlotWeighingPerformanceReportOutputType
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/feedlot-weighing-performance-report',
    {
      corral_uuid: params.corral_uuid || undefined,
      batch_uuid: params.batch_uuid || undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      report_type: reportType,
    },
    { responseType: 'blob' }
  );
  return data;
}

async function downloadFeedlotWeighingPerformanceReportPdf(
  params: FeedlotWeighingPerformanceReportParams
): Promise<Blob> {
  return downloadFeedlotWeighingPerformanceReport(params, 'pdf');
}

async function downloadFeedlotWeighingPerformanceReportXlsx(
  params: FeedlotWeighingPerformanceReportParams
): Promise<Blob> {
  return downloadFeedlotWeighingPerformanceReport(params, 'excel');
}

export {
  downloadFeedlotWeighingPerformanceReportPdf,
  downloadFeedlotWeighingPerformanceReportXlsx,
};
