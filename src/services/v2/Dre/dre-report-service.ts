// src/services/v2/Dre/dre-report-service.ts
// -----------------------------------------------------------------------------
// Relatório de DRE mensal (F-259, TASK-DRE-FE-01, esteira 049). Mirror
// estrutural de `double-entry-accounting-report-service.ts` — 1 função de
// download síncrono, resposta BINÁRIA (`application/pdf`),
// `responseType: 'blob'` obrigatório (sem isso o axios corrompe o PDF).
//
// Endpoint: `GET /api/v1/dre` (`DreReportController`, `contrato-api-dre.md
// §4`). Envelope `{success,message,data,errors,meta}` NÃO se aplica (mesma
// exceção documentada para controllers de relatório binário).
//
// SEM `farm_id` no payload (contrato-tela-dre-fe.md §2 LC-FE-04) — a fazenda
// ativa vai pelo header `X-Farm-Id` automático do client
// (`get_spa_api_client_pattern §2`), nunca por parâmetro de query.
// -----------------------------------------------------------------------------

import api from '@/services/api';

export type DreTypeReport = 1 | 2;

export interface DreReportParams {
  type_report: DreTypeReport;
  start_date: string;
  end_date: string;
  center_id?: string;
}

async function downloadDreReport(params: DreReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/dre',
    {
      type_report: params.type_report,
      start_date: params.start_date,
      end_date: params.end_date,
      center_id: params.center_id || undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadDreReport };
