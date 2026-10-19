// src/services/v2/Integrations/export-movements-dominio-service.ts
// Service da tela STANDALONE "Exportação Movimento Bancário → Domínio"
// (F-116, Integrações, irmã do canário F-119). Download binário síncrono
// (V3 — `responseType: 'blob'`), mirror de
// `export-nfse-dominio-service.ts`. Service DEDICADO — NÃO reusa
// `src/services/v2/ImportExport`.
//
// `X-Farm-Id` (uuid) é injetado automaticamente pelo interceptor de request
// do `api.V2` (`src/services/api.ts`) — o payload NUNCA carrega `farm_id`
// (contrato de tela §2.1/§3).

import api from '@/services/api';

import type { ExportMovementsDominioExportRequest } from '@/@types/v2/Integrations/exportMovementsDominio';

const BASE = '/integrations/exports/movements-dominio';

/**
 * Dispara o export e devolve o `Blob` binário (xlsx) para `downloadBlob`.
 * Erros (422/401/403/5xx) chegam como `Blob` de JSON — usar `parseBlobError`
 * no `catch` do call site (contrato de tela §Leitura do dev, risco 2).
 * @param {ExportMovementsDominioExportRequest} params - `start_date`/`end_date` ISO `yyyy-MM-dd` + `type` (1|2).
 * @return {Promise<Blob>} Blob binário do xlsx gerado.
 */
export async function exportMovementsDominio(
  params: ExportMovementsDominioExportRequest
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(BASE, params, { responseType: 'blob' });
  return data;
}
