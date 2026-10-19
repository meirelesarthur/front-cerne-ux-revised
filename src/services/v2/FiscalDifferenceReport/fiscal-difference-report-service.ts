// src/services/v2/FiscalDifferenceReport/fiscal-difference-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Fiscal/Não Fiscal" (F-266, lote 076,
// `FiscalDifferenceReport-contrato.md`). Mirror ESTRUTURAL EXATO de
// `Relatorios/costing-animal-report-service.ts` (1 função interna + 2
// wrappers PDF/Excel) — resposta BINÁRIA, `responseType: 'blob'` obrigatório
// (inclusive erro 422, que chega como `Blob` e precisa de `parseBlobError`
// no `catch` da tela).
//
// Endpoint: `GET /api/v1/fiscal-difference-report`
// (`app/Http/Requests/Api/V1/FiscalDifferenceReportRequest.php`, lido
// diretamente). Envelope `{success,message,data,errors,meta}` NÃO se aplica
// ao sucesso — mesma exceção documentada nos irmãos de download binário
// (`get_spa_api_client_pattern`, `COMPONENTE-RELATORIOS.md §8`).
//
// `format` vai como STRING `'pdf'`/`'xlsx'` (Request real: `'in:pdf,xlsx'` —
// NÃO `'excel'`, divergente do irmão `costing-animal-report-service.ts`,
// conferido por leitura direta do Request antes de escrever este service).
//
// `accounts`/`categories` vazios viram `undefined` (nunca `[]` na
// querystring — mirror `cash-flow-by-category-report-service.ts`).
//
// SEM `X-Farm-Id` manual no payload — a fazenda ativa vai pelo header
// automático do client (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type {
  FiscalDifferenceReportFormat,
  FiscalDifferenceReportParams,
} from '@/@types/v2/FiscalDifferenceReport';

async function downloadFiscalDifferenceReport(
  params: FiscalDifferenceReportParams,
  format: FiscalDifferenceReportFormat
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/fiscal-difference-report',
    {
      accounts: params.accounts && params.accounts.length > 0 ? params.accounts : undefined,
      proprietary: params.proprietary || undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      center_id: params.center_id || undefined,
      categories: params.categories && params.categories.length > 0 ? params.categories : undefined,
      is_fiscal: params.is_fiscal || undefined,
      condition: params.condition,
      format,
    },
    { responseType: 'blob' }
  );
  return data;
}

async function downloadFiscalDifferenceReportPdf(
  params: FiscalDifferenceReportParams
): Promise<Blob> {
  return downloadFiscalDifferenceReport(params, 'pdf');
}

async function downloadFiscalDifferenceReportXlsx(
  params: FiscalDifferenceReportParams
): Promise<Blob> {
  return downloadFiscalDifferenceReport(params, 'xlsx');
}

export { downloadFiscalDifferenceReportPdf, downloadFiscalDifferenceReportXlsx };
