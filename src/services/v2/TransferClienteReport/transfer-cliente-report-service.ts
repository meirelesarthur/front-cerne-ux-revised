// src/services/v2/TransferClienteReport/transfer-cliente-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Romaneio Cliente" (F-332, esteira 97-Esteiras/058,
// TASK-058-F332-FE-01). Mirror estrutural de `advance-report-service.ts` — 1
// função de download síncrono, resposta BINÁRIA (`application/pdf`),
// `responseType: 'blob'` OBRIGATÓRIO (sem isso o axios corrompe o arquivo).
//
// Endpoint: `GET /api/v1/transfer-cliente-report` (permissão REUSA a
// canônica já existente `transfers_view`, mesma do CRUD de Romaneios —
// nunca slug novo, já seeded). PDF-ONLY: `format` é sempre o literal
// `'pdf'`, nunca lido do form/schema (contrato de tela §2.3).
//
// `X-Farm-Id` é automático (interceptor genérico de `@/services/api.ts`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface DownloadTransferClienteReportParams {
  clients?: string;
  start_date: string;
  end_date: string;
}

async function downloadTransferClienteReport(
  params: DownloadTransferClienteReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/transfer-cliente-report',
    {
      clients: params.clients || undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      format: 'pdf',
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadTransferClienteReport };
