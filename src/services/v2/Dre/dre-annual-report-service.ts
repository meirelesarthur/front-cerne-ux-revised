// src/services/v2/Dre/dre-annual-report-service.ts
// -----------------------------------------------------------------------------
// Relatório de DRE Anual (F-258, TASK-DRE-FE-03, esteira 049). Mesma forma de
// `dre-report-service.ts` (tela irmã), endpoint `/dre-annual`, params
// `{ type_report, start_year, end_year, center_id? }` — resposta BINÁRIA
// (`application/pdf`), `responseType: 'blob'` obrigatório.
//
// Endpoint: `GET /api/v1/dre-annual` (`DreAnnualReportController`,
// `contrato-api-dre.md §4`). SEM `farm_id` no payload (mesma razão da tela
// irmã — `X-Farm-Id` automático do client).
// -----------------------------------------------------------------------------

import api from '@/services/api';
import type { DreTypeReport } from '@/services/v2/Dre/dre-report-service';

export interface DreAnnualReportParams {
  type_report: DreTypeReport;
  start_year: number;
  end_year: number;
  center_id?: string;
}

async function downloadDreAnnualReport(params: DreAnnualReportParams): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/dre-annual',
    {
      type_report: params.type_report,
      start_year: params.start_year,
      end_year: params.end_year,
      center_id: params.center_id || undefined,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadDreAnnualReport };
