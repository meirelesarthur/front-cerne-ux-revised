// src/services/v2/Relatorios/receipt-schedule-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Agenda/Recebimentos" (F-304, TASK-055-F304-FE-01, esteira
// 97-Esteiras/055). Mirror ESTRUTURAL de `receipts-report-service.ts` — 1
// função de download síncrono, resposta BINÁRIA (PDF ou Excel conforme
// `format`), `responseType: 'blob'` obrigatório — inclusive erro 422, que
// chega como `Blob` e precisa de `parseBlobError` no `catch`/`onError` da
// tela.
//
// Endpoint: `GET /api/v1/receipt-schedule-report?format=pdf|xlsx` (roteiro
// front F-304 §2, roteiro API F-304 §4/§5-D2). Envelope `{success,message,
// data,errors,meta}` NÃO se aplica — mesma exceção documentada para
// controllers de relatório binário (`get_spa_api_client_pattern
// §COMPONENTE-RELATORIOS`).
//
// `format` é `'pdf' | 'xlsx'` (`ReportFormat`, `@/@types/v2/AccountsReports`)
// — NÃO o domínio inline `'pdf' | 'excel'` do irmão `receipts-report-
// service.ts` (F-305, divergência adjudicada, roteiro §4.1).
//
// SEM `X-Farm-Id` manual no payload — a fazenda ativa vai pelo header
// automático do client (`get_spa_api_client_pattern §2`). O parâmetro
// `farm` abaixo é um FILTRO EXPLÍCITO do relatório (fiel ao legado
// `request->farm`, roteiro §7-D1), distinto da fazenda ativa do header.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { ReportFormat } from '@/@types/v2/AccountsReports';

export interface ReceiptScheduleReportParams {
  clients?: string[];
  farm?: string;
  proprietary_id?: string;
  categories?: string[];
  center_id?: string;
  start_date?: string;
  end_date?: string;
  format: ReportFormat;
}

async function downloadReceiptScheduleReport(params: ReceiptScheduleReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/receipt-schedule-report',
    {
      clients: params.clients && params.clients.length > 0 ? params.clients : undefined,
      farm: params.farm || undefined,
      proprietary_uuid: params.proprietary_id || undefined,
      categories: params.categories && params.categories.length > 0 ? params.categories : undefined,
      center_uuid: params.center_id || undefined,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadReceiptScheduleReport };
