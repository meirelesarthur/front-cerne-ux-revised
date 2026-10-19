// src/services/v2/Integrations/export-financial-csv-service.ts
// Service da tela STANDALONE "Exportação Financeira CSV — C. Pagas/Recebidas"
// (F-120, Integrações, irmã do canário F-119). Download binário síncrono
// (V3 — `responseType: 'blob'`), NÃO o padrão V2 assíncrono
// (`ExportDownloadButton`/`useExportDownload`/`exportDownloadStorage`).
// Service DEDICADO — NÃO reusa `src/services/v2/ImportExport`
// (hard-typed `'expenses'|'incomes'`).
//
// `X-Farm-Id` (uuid) é injetado automaticamente pelo interceptor de request
// do `api.V2` (`src/services/api.ts`) — o payload NUNCA carrega `farm_id`
// (anti-padrão P0, proibido replicar — mesma fidelidade do canário F-119).

import api from '@/services/api';

import type { ExportFinancialCsvExportRequest } from '@/@types/v2/Integrations/exportFinancialCsv';

const BASE = '/integrations/exports/financial-csv';

/**
 * Dispara o export e devolve o `Blob` binário (CSV) para `downloadBlob`.
 * Erros (422/401/403/5xx) chegam como `Blob` de JSON — usar `parseBlobError`
 * no `catch` do call site (contrato de tela §Leitura do dev, risco 2).
 * @param {ExportFinancialCsvExportRequest} params - `start_date`/`end_date` ISO `yyyy-MM-dd`.
 * @return {Promise<Blob>} Blob binário do CSV gerado (tratado como blob genérico).
 */
export async function exportFinancialCsv(params: ExportFinancialCsvExportRequest): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(BASE, params, { responseType: 'blob' });
  return data;
}
