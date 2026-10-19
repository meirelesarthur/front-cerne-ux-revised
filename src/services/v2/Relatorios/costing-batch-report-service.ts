// src/services/v2/Relatorios/costing-batch-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Custeio/Lote" (F-20c552f0, TASK-CL-FE-01, esteira 074). Mirror
// ESTRUTURAL de `Sanitaries/sanitaries-service.ts::downloadSanitariesBatchReport`
// (1 função interna + 2 wrappers) e `Relatorios/receipts-report-service.ts` —
// resposta BINÁRIA (PDF ou Excel conforme `type`), `responseType: 'blob'`
// obrigatório (inclusive erro 422, que chega como `Blob` e precisa de
// `parseBlobError` no `catch` da tela).
//
// `type` vai como STRING (`'pdf'`/`'excel'`) — mirror do enum novo
// `CusteioLoteReportOutputType` (backend, `Rule::enum(...)`), NÃO o índice
// posicional numérico legado que `sanitaries-service.ts` ainda preserva por
// fidelidade a uma feature mais antiga (contrato front §4, "Riscos" item 4).
//
// Endpoint: `GET /api/v1/costing-batch-report` (contrato de tela
// `custeio-lote-contrato-front.md` §4, contrato de API
// `custeio-lote-contrato-api.md`). Envelope `{success,message,data,errors,
// meta}` NÃO se aplica — mesma exceção documentada para controllers de
// relatório binário (`get_spa_api_client_pattern`, `COMPONENTE-RELATORIOS.md
// §8`).
//
// SEM `X-Farm-Id` manual no payload — a fazenda ativa vai pelo header
// automático do client (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface CusteioLoteReportParams {
  batches?: string[];
  start_date: string;
  end_date: string;
}

async function downloadCusteioLoteReport(
  params: CusteioLoteReportParams,
  type: 'pdf' | 'excel'
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/costing-batch-report',
    {
      batches: params.batches?.length ? params.batches : undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      type,
    },
    { responseType: 'blob' }
  );
  return data;
}

async function downloadCusteioLoteReportPdf(params: CusteioLoteReportParams): Promise<Blob> {
  return downloadCusteioLoteReport(params, 'pdf');
}

async function downloadCusteioLoteReportXlsx(params: CusteioLoteReportParams): Promise<Blob> {
  return downloadCusteioLoteReport(params, 'excel');
}

export { downloadCusteioLoteReportPdf, downloadCusteioLoteReportXlsx };
