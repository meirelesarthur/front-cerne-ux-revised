// src/services/v2/NfeProductReport/nfe-product-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Faturamento" (F-286, esteira 97-Esteiras/054, TASK-054-286-FE-01).
// Mirror estrutural de `machines-report-service.ts` — 1 função de download
// síncrono, resposta BINÁRIA (PDF ou Excel conforme `type`),
// `responseType: 'blob'` OBRIGATÓRIO (sem isso o axios corrompe o binário).
//
// Endpoint: `GET /api/v1/nfes-report` (`NfeProductReportRequest`,
// roteiro-api-F286-faturamento.md §3). Envelope
// `{success,message,data,errors,meta}` NÃO se aplica (mesma exceção
// documentada para controllers de relatório binário); erro 422/401/403
// chega como `Blob` também — o chamador usa `parseBlobError` no `catch`.
//
// `X-Farm-Id` é automático (interceptor de `@/services/api.ts`) — os 7
// campos são listados EXPLICITAMENTE (armadilha ERRO-FE-016: nunca
// descartar parâmetro em silêncio); string/array vazios viram `undefined`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { NfeProductReportParams } from '@/@types/v2/NfeProductReport';

async function downloadNfeProductReport(params: NfeProductReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/nfes-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      client_ids: params.client_ids && params.client_ids.length > 0 ? params.client_ids : undefined,
      farm_ids: params.farm_ids && params.farm_ids.length > 0 ? params.farm_ids : undefined,
      product_ids:
        params.product_ids && params.product_ids.length > 0 ? params.product_ids : undefined,
      issuer_id: params.issuer_id || undefined,
      type: params.type ?? undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadNfeProductReport };
