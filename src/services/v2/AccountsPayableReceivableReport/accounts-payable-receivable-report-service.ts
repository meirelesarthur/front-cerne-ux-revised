// src/services/v2/AccountsPayableReceivableReport/accounts-payable-receivable-report-service.ts
// -----------------------------------------------------------------------------
// Relatório Consolidado de Contas a Pagar e Receber (F-214, esteira
// 97-Esteiras/052, TASK-052-214-FE-01). Mirror estrutural de
// `expense-report-service.ts`/`cost-center-report-service.ts` — 1 função de
// download síncrono, resposta BINÁRIA (`application/pdf` ou
// `.../spreadsheetml.sheet` conforme `format`), `responseType: 'blob'`
// OBRIGATÓRIO (sem isso o axios corrompe o arquivo).
//
// Endpoint: `GET /api/v1/accounts-payable-receivable-report` (permissão
// `accounts_payable_receivable_report`, `AccountsPayableReceivableReportRequest`
// — 11 filtros/contrato). Envelope `{success,message,data,errors,meta}` NÃO
// se aplica ao sucesso (binário bypassa o envelope, roteiro de arquitetura
// §3); erro 422/401/403 chega como `Blob` também — o chamador usa
// `parseBlobError` no `catch`.
//
// Lista os 11 campos EXPLICITAMENTE (armadilha #10 do checklist —
// `provider-service.ts` §cabeçalho — nunca descartar params no service):
// string vazia/ausente vira `undefined` (nunca `''`/`null`); `status[]`
// vazio também vira `undefined`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { AccountsPayableReceivableReportParams } from '@/@types/v2/AccountsPayableReceivableReport';

async function downloadAccountsPayableReceivableReport(
  params: AccountsPayableReceivableReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/accounts-payable-receivable-report',
    {
      start_emission_date: params.start_emission_date,
      end_emission_date: params.end_emission_date,
      start_write_off_date: params.start_write_off_date || undefined,
      end_write_off_date: params.end_write_off_date || undefined,
      provider: params.provider || undefined,
      client: params.client || undefined,
      center: params.center || undefined,
      account: params.account || undefined,
      category: params.category || undefined,
      status: params.status && params.status.length > 0 ? params.status : undefined,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadAccountsPayableReceivableReport };
