// src/services/v2/Integrations/export-nfse-dominio-service.ts
// Service da tela STANDALONE "Exportação NFS-e → Domínio" (F-119,
// Integrações, canário `97-Esteiras/071`). Download binário síncrono
// (V3 — `responseType: 'blob'`), NÃO o padrão V2 assíncrono
// (`ExportDownloadButton`/`useExportDownload`/`exportDownloadStorage` —
// confirmado inexistentes neste repo, Decisão B do contrato de tela).
// Service DEDICADO — NÃO reusa `src/services/v2/ImportExport`
// (hard-typed `'expenses'|'incomes'`).
//
// `X-Farm-Id` (uuid) é injetado automaticamente pelo interceptor de request
// do `api.V2` (`src/services/api.ts`) — o payload NUNCA carrega `farm_id`
// (o legado vazava tenant via querystring, OQ-03/CL-04; proibido replicar).

import api from '@/services/api';

import type { ExportNfseDominioExportRequest } from '@/@types/v2/Integrations/exportNfseDominio';

const BASE = '/integrations/exports/nfse-dominio';

/**
 * Dispara o export e devolve o `Blob` binário (xlsx) para `downloadBlob`.
 * Erros (422/401/403/5xx) chegam como `Blob` de JSON — usar `parseBlobError`
 * no `catch` do call site (contrato de tela §Leitura do dev, risco 1).
 * @param {ExportNfseDominioExportRequest} params - `start_date`/`end_date` ISO `yyyy-MM-dd`.
 * @return {Promise<Blob>} Blob binário do xlsx gerado.
 */
export async function exportNfseDominio(params: ExportNfseDominioExportRequest): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(BASE, params, { responseType: 'blob' });
  return data;
}
