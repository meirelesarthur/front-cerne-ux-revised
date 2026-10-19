// src/services/v2/Relatorios/ans-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "ANS" (F-229, lote 076, `F-229-ans-report-contrato-api.md`).
// Mirror ESTRUTURAL EXATO de `Relatorios/costing-animal-report-service.ts`
// (1 função interna + 2 wrappers) — resposta BINÁRIA (PDF ou Excel conforme
// `report_type`), `responseType: 'blob'` obrigatório (inclusive erro 422, que
// chega como `Blob` e precisa de `parseBlobError` no `catch` da tela).
//
// Endpoint: `GET /api/v1/request-purchases/ans-report` (contrato de API
// §2, `AnsReportRequest::rules()` lido diretamente). O parâmetro de FORMATO é
// `report_type` (não `type`/`format` — divergência documentada do contrato
// §4), enum `AnsReportOutputType` (`'pdf'`/`'excel'`, mirror EXATO dos
// valores usados por `costing-animal-report-service.ts`).
//
// Envelope `{success,message,data,errors,meta}` NÃO se aplica ao sucesso —
// mesma exceção documentada nos irmãos de download binário
// (`get_spa_api_client_pattern`, `COMPONENTE-RELATORIOS.md §8`).
//
// SEM `X-Farm-Id` manual no payload — a fazenda ativa vai pelo header
// automático do client (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface AnsReportParams {
  start_date: string;
  end_date: string;
}

async function downloadAnsReport(
  params: AnsReportParams,
  reportType: 'pdf' | 'excel'
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/request-purchases/ans-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      report_type: reportType,
    },
    { responseType: 'blob' }
  );
  return data;
}

async function downloadAnsReportPdf(params: AnsReportParams): Promise<Blob> {
  return downloadAnsReport(params, 'pdf');
}

async function downloadAnsReportXlsx(params: AnsReportParams): Promise<Blob> {
  return downloadAnsReport(params, 'excel');
}

export { downloadAnsReportPdf, downloadAnsReportXlsx };
