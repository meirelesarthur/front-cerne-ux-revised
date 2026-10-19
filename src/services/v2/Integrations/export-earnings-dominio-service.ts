// src/services/v2/Integrations/export-earnings-dominio-service.ts
// Service da tela STANDALONE "Exportação Folha Salarial → Domínio" (F-117,
// Integrações, irmã do canário F-119). Download binário síncrono
// (V3 — `responseType: 'blob'`), mirror de
// `export-nfse-dominio-service.ts`/`export-movements-dominio-service.ts`.
// Service DEDICADO — NÃO reusa `src/services/v2/ImportExport`.
//
// `X-Farm-Id` (uuid) é injetado automaticamente pelo interceptor de request
// do `api.V2` (`src/services/api.ts`) — o payload NUNCA carrega `farm_id`
// (contrato de tela §2.1/§3).

import api from '@/services/api';

import type { ExportEarningsDominioExportRequest } from '@/@types/v2/Integrations/exportEarningsDominio';

const BASE = '/integrations/exports/earnings-dominio';

/**
 * Dispara o export e devolve o `Blob` binário (xlsx) para `downloadBlob`.
 * Erros (422/401/403/5xx) chegam como `Blob` de JSON — usar `parseBlobError`
 * no `catch` do call site (contrato de tela §Leitura do dev, risco 3).
 * @param {ExportEarningsDominioExportRequest} params - `year` (4 díg.) + `month` (1..12).
 * @return {Promise<Blob>} Blob binário do xlsx gerado.
 */
export async function exportEarningsDominio(
  params: ExportEarningsDominioExportRequest
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(BASE, params, { responseType: 'blob' });
  return data;
}
