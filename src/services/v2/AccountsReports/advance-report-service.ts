// src/services/v2/AccountsReports/advance-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Adiantamento — Títulos Baixados" (F-219, esteira
// 97-Esteiras/055, TASK-055-FE-01). Mirror estrutural de
// `pag-prev-real-report-service.ts` — 1 função de download síncrono,
// resposta BINÁRIA (`application/pdf` ou `.../spreadsheetml.sheet`),
// `responseType: 'blob'` OBRIGATÓRIO (sem isso o axios corrompe o arquivo).
//
// Endpoint: `GET /api/v1/advance-report` (permissão `advance-titles_report`,
// `AdvanceReportRequest` — 9 filtros + `format`). Envelope
// `{success,message,data,errors,meta}` NÃO se aplica ao sucesso (mesma
// exceção documentada em `expense-report-service.ts`); erro 422/401/403
// chega como `Blob` também — o chamador usa `parseBlobError` no `catch`.
//
// `X-Farm-Id` é automático (interceptor genérico de `@/services/api.ts`) —
// `farm_id` aqui é um FILTRO explícito do relatório, não deve ser confundido
// com a fazenda ativa.
//
// Lista os 9 campos EXPLICITAMENTE (armadilha do checklist —
// `provider-service.ts` §cabeçalho — nunca descartar params no service):
// string vazia/ausente vira `undefined` (nunca `''`/`null`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { AdvanceReportParams } from '@/@types/v2/AccountsReports';

async function downloadAdvanceReport(params: AdvanceReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/advance-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      number: params.number || undefined,
      farm: params.farm_id || undefined,
      provider: params.provider_id || undefined,
      client: params.client_id || undefined,
      proprietary: params.proprietary_id || undefined,
      center: params.center_id || undefined,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadAdvanceReport };
