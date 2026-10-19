// src/services/v2/AccountsReports/paid-expense-report-service.ts
// -----------------------------------------------------------------------------
// Relatório de Contas Pagas (títulos a pagar já baixados) — F-291, esteira
// 97-Esteiras/050, TASK-050-291-FE-01. Mirror estrutural de
// `expense-report-service.ts` (irmão "em aberto").
//
// Endpoint: `GET /api/v1/paid-expenses-report` (permissão
// `expenses_paid_report`, `PaidExpenseReportRequest` — 16
// filtros/contrato). `responseType: 'blob'` OBRIGATÓRIO — resposta é o
// BINÁRIO puro (PDF/XLSX), envelope `ApiResponse` NÃO se aplica ao sucesso;
// erro 422/401/403 chega como `Blob` também (`parseBlobError` no `catch` do
// chamador).
//
// `start_date`/`end_date` (campos 1-2 do contrato de tela) filtram a DATA DE
// BAIXA (D-291-04), NÃO o vencimento — mesmos nomes de parâmetro do irmão
// `expense-report-service.ts`, semântica DIFERENTE (o Request desta rota
// não tem `periodicity`; tem `account_id`/`harvest_id`, que o irmão não
// tem). `X-Farm-Id` é automático (interceptor genérico de
// `@/services/api.ts`) — `farm_id` aqui é um filtro explícito do relatório
// (D-FE-04), distinto do header.
//
// Lista os 16 campos EXPLICITAMENTE (nunca descartar params no service):
// string vazia/ausente vira `undefined`; arrays vazios também.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaidExpenseReportParams } from '@/@types/v2/AccountsReports';

async function downloadPaidExpenseReport(params: PaidExpenseReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/paid-expenses-report',
    {
      providers: params.providers && params.providers.length > 0 ? params.providers : undefined,
      categories: params.categories && params.categories.length > 0 ? params.categories : undefined,
      proprietary_id: params.proprietary_id || undefined,
      account_id: params.account_id || undefined,
      center_id: params.center_id || undefined,
      harvest_id: params.harvest_id || undefined,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      start_emission_date: params.start_emission_date || undefined,
      end_emission_date: params.end_emission_date || undefined,
      classification: params.classification || undefined,
      farm_id: params.farm_id || undefined,
      columns: params.columns,
      order: params.order,
      order_direction: params.order_direction,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadPaidExpenseReport };
