// src/services/v2/AccountsReports/income-report-service.ts
// -----------------------------------------------------------------------------
// Relatório de Contas a Receber em aberto (F-271, esteira 97-Esteiras/050,
// TASK-050-271-FE-01). Mirror estrutural de `expense-report-service.ts`
// (irmão do lado despesa) — 1 função de download síncrono, resposta BINÁRIA
// (`application/pdf` ou `.../spreadsheetml.sheet`), `responseType: 'blob'`
// OBRIGATÓRIO (sem isso o axios corrompe o arquivo).
//
// Endpoint: `GET /api/v1/incomes-report` (permissão `incomes_report`,
// `IncomeReportRequest` — 12 filtros/contrato). Envelope
// `{success,message,data,errors,meta}` NÃO se aplica ao sucesso (mesma
// exceção documentada em `dre-report-service.ts`/`expense-report-service.ts`);
// erro 422/401/403 chega como `Blob` também — o chamador usa `parseBlobError`
// no `catch`.
//
// `X-Farm-Id` é automático (interceptor genérico de `@/services/api.ts`) —
// `farm_id` aqui é um FILTRO explícito do relatório (D-FE-04, distinto do
// header), não deve ser confundido com a fazenda ativa.
//
// SEM `classification` — `IncomeReportRequest` não aceita este parâmetro
// nesta rota (contrato de tela §2, "não inventar").
//
// Lista os 12 campos EXPLICITAMENTE (armadilha #10 do checklist —
// `provider-service.ts` §cabeçalho — nunca descartar params no service):
// string vazia/ausente vira `undefined` (nunca `''`/`null`); arrays vazios
// também viram `undefined`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { IncomeReportParams } from '@/@types/v2/AccountsReports';

async function downloadIncomeReport(params: IncomeReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/incomes-report',
    {
      clients: params.clients && params.clients.length > 0 ? params.clients : undefined,
      categories: params.categories && params.categories.length > 0 ? params.categories : undefined,
      center_id: params.center_id || undefined,
      proprietary_id: params.proprietary_id || undefined,
      farm_id: params.farm_id || undefined,
      periodicity: params.periodicity ?? undefined,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      start_emission_date: params.start_emission_date || undefined,
      end_emission_date: params.end_emission_date || undefined,
      columns: params.columns,
      order: params.order,
      order_direction: params.order_direction,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadIncomeReport };
