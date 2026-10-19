// src/services/v2/DoubleEntryAccountingReports/double-entry-accounting-report-service.ts
// -----------------------------------------------------------------------------
// Relatório de Partida Dobrada (F-257, TASK-PDR-FE-02, esteira 069). Mirror
// estrutural de `account-reconciliation-report-service.ts`/
// `financialCategoryTypeReport-service.ts` — 1 função de download síncrono,
// resposta BINÁRIA (`application/pdf`), `responseType: 'blob'` obrigatório
// (sem isso o axios corrompe o PDF).
//
// Endpoint: `GET /api/v1/double-entry-accounting-reports`
// (`DoubleEntryAccountingReportController`, já implementado + testado,
// `DoubleEntryAccountingReportControllerTest`). Envelope `{success,message,
// data,errors,meta}` NÃO se aplica (mesma exceção documentada para
// controllers de relatório binário).
//
// `plan_account_uuid` é `prohibited_if:report_type,balance_sheet` no
// servidor (422 se enviado) — esta função OMITE o campo (`undefined`)
// quando `report_type === 'balance_sheet'`, defesa em profundidade além do
// disable de UI da tela (`TASK-PDR-FE-04`).
//
// `listPlanAccountOptions` (lookup de conta contábil) NÃO é recriado aqui —
// importar direto de `@/services/v2/PlanAccounts/plan-account-service` nas
// telas consumidoras, com `{ class: 2, is_enabled: 'true' }`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

export type DoubleEntryAccountingReportType =
  'journal' | 'general_ledger' | 'trial_balance' | 'balance_sheet';

export type DoubleEntryAccountingReportOrderBy = 'asc' | 'desc';

export interface DoubleEntryAccountingReportParams {
  report_type: DoubleEntryAccountingReportType;
  plan_account_uuid?: string;
  start_date: string;
  end_date: string;
  order_by: DoubleEntryAccountingReportOrderBy;
}

async function downloadDoubleEntryAccountingReport(
  params: DoubleEntryAccountingReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/double-entry-accounting-reports',
    {
      report_type: params.report_type,
      plan_account_uuid:
        params.report_type === 'balance_sheet' ? undefined : params.plan_account_uuid || undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      order_by: params.order_by,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadDoubleEntryAccountingReport };
