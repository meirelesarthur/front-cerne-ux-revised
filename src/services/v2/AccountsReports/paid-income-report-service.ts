// src/services/v2/AccountsReports/paid-income-report-service.ts
// -----------------------------------------------------------------------------
// Relatório de Contas Recebidas (títulos a receber já baixados) — F-292,
// esteira 97-Esteiras/050, TASK-050-292-FE-01. Mirror estrutural de
// `income-report-service.ts` (irmão "em aberto").
//
// Endpoint: `GET /api/v1/paid-incomes-report` (permissão
// `incomes_paid_report`, `PaidIncomeReportRequest` — 14 filtros/contrato).
// `responseType: 'blob'` OBRIGATÓRIO — resposta é o BINÁRIO puro (PDF/XLSX),
// envelope `ApiResponse` NÃO se aplica ao sucesso; erro 422/401/403 chega
// como `Blob` também (`parseBlobError` no `catch` do chamador).
//
// Superfície MENOR que o irmão F-291 DE PROPÓSITO (`D-292-SIM`, docblock do
// `PaidIncomeReportRequest`) — SEM `harvest_id`, SEM `classification`, SEM
// `periodicity` (nenhum destes é parâmetro desta rota; não adicionar).
// Datas 1-2 do contrato de tela filtram a DATA DE BAIXA (D-292-09), não o
// vencimento. `X-Farm-Id` é automático (interceptor genérico de
// `@/services/api.ts`) — `farm_id` aqui é um filtro explícito do relatório
// (D-FE-04), distinto do header.
//
// Lista os 14 campos EXPLICITAMENTE (nunca descartar params no service):
// string vazia/ausente vira `undefined`; arrays vazios também.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaidIncomeReportParams } from '@/@types/v2/AccountsReports';

async function downloadPaidIncomeReport(params: PaidIncomeReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/paid-incomes-report',
    {
      clients: params.clients && params.clients.length > 0 ? params.clients : undefined,
      categories: params.categories && params.categories.length > 0 ? params.categories : undefined,
      proprietary_id: params.proprietary_id || undefined,
      account_id: params.account_id || undefined,
      center_id: params.center_id || undefined,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      start_emission_date: params.start_emission_date || undefined,
      end_emission_date: params.end_emission_date || undefined,
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

export { downloadPaidIncomeReport };
