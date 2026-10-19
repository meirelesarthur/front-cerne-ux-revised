// src/services/v2/Relatorios/payment-schedule-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Agenda/Pagamentos" (F-294, CONTRATO-F294-agenda-pagamentos.md,
// esteira 97-Esteiras/059). Mirror ESTRUTURAL de
// `receipt-schedule-report-service.ts` (F-304, sibling mais próximo) — 1
// função de download síncrono, resposta BINÁRIA (PDF ou Excel conforme
// `format`), `responseType: 'blob'` obrigatório — inclusive erro 422, que
// chega como `Blob` e precisa de `parseBlobError` no `catch`/`onError` da
// tela.
//
// Endpoint: `GET /api/v1/payment-schedule-report?format=pdf|xlsx`
// (`PaymentScheduleReportController::__invoke()`,
// `PaymentScheduleReportRequest::rules()` — permissão `payment-schedule_view`,
// já registrada, sem seeder novo). Envelope `{success,message,data,errors,
// meta}` NÃO se aplica ao sucesso (binário bypassa o envelope, exceção
// documentada em `get_laravel_response_exception_pattern` §5, mesma dos
// irmãos `expense-report-service.ts`/`accounts-payable-receivable-report-
// service.ts`).
//
// Nomes de parâmetro são LITERAIS os de `PaymentScheduleReportRequest::
// rules()` (`farm`, `start_date`, `end_date`, `number`, `proprietary_id`,
// `status`, `center_id`, `categories`/`categories.*`, `format`) — NÃO os
// apelidos `proprietary_uuid`/`center_uuid` do irmão `receipt-schedule-
// report-service.ts` (contrato próprio, nomes diferentes por FormRequest).
//
// `status` é filtro ESCALAR (`int`, 1-4 com efeito na query — 5-8 aceitos
// pela validação, sem efeito, DEC-265), NÃO array — divergência registrada
// no contrato/`PaymentScheduleReportFilterData` (não confundir com
// `AccountsPayableReceivableReportParams.status`, que É array).
//
// SEM `X-Farm-Id` manual no payload — a fazenda ativa vai pelo header
// automático do client (`get_spa_api_client_pattern §2`). O parâmetro `farm`
// abaixo é um FILTRO EXPLÍCITO do relatório (fiel ao legado, restringe
// dentro do tenant inteiro já resolvido via `X-Farm-Id`/`currentTenant`,
// DEC-260), distinto da fazenda ativa do header.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { ReportFormat } from '@/@types/v2/AccountsReports';

export interface PaymentScheduleReportParams {
  farm?: string;
  start_date?: string;
  end_date?: string;
  number?: string;
  proprietary_id?: string;
  status?: number;
  center_id?: string;
  categories?: string[];
  format: ReportFormat;
}

async function downloadPaymentScheduleReport(params: PaymentScheduleReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/payment-schedule-report',
    {
      farm: params.farm || undefined,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      number: params.number || undefined,
      proprietary_id: params.proprietary_id || undefined,
      status: params.status ?? undefined,
      center_id: params.center_id || undefined,
      categories: params.categories && params.categories.length > 0 ? params.categories : undefined,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadPaymentScheduleReport };
