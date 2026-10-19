// src/services/v2/AccountsReports/pag-prev-real-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Pagamento Previsto × Real" (F-289, esteira 97-Esteiras/054,
// TASK-289-FE-01). Mirror estrutural de `expense-report-service.ts` — 1
// função de download síncrono, resposta BINÁRIA (`application/pdf` ou
// `.../spreadsheetml.sheet`), `responseType: 'blob'` OBRIGATÓRIO (sem isso
// o axios corrompe o arquivo).
//
// Endpoint: `GET /api/v1/pag-prev-real-report` (permissão `pag_prev_report`,
// `PagPrevRealReportRequest` — 8 filtros + `format`). Envelope
// `{success,message,data,errors,meta}` NÃO se aplica ao sucesso (mesma
// exceção documentada em `expense-report-service.ts`); erro 422/401/403
// chega como `Blob` também — o chamador usa `parseBlobError` no `catch`.
//
// `X-Farm-Id` é automático (interceptor genérico de `@/services/api.ts`) —
// `farm_id` aqui é um FILTRO explícito do relatório, não deve ser confundido
// com a fazenda ativa.
//
// Lista os 8 campos EXPLICITAMENTE (armadilha do checklist —
// `provider-service.ts` §cabeçalho — nunca descartar params no service):
// string vazia/ausente vira `undefined` (nunca `''`/`null`); arrays vazios
// também viram `undefined`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PagPrevRealReportParams } from '@/@types/v2/AccountsReports';

async function downloadPagPrevRealReport(params: PagPrevRealReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/pag-prev-real-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      providers: params.providers && params.providers.length > 0 ? params.providers : undefined,
      proprietary_id: params.proprietary_id || undefined,
      center_id: params.center_id || undefined,
      categories: params.categories && params.categories.length > 0 ? params.categories : undefined,
      farm_id: params.farm_id || undefined,
      condition: params.condition ?? undefined,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadPagPrevRealReport };
