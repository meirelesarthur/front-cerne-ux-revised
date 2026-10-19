// src/services/v2/Earnings/monthly-calculation-report-service.ts
// -----------------------------------------------------------------------------
// Monthly Calculation Report Service — API v1 do backend Laravel GB.Cerne
// (TASK-07-57, feature Apuração Mensal F-285, `97-Esteiras/007`). Endpoint
// FLAT (`GET /monthly-calculation-report`, TASK-07-34, SEM `permission:` no
// servidor — DEC-DOM-19, fidelidade estrita ao legado). Coexiste no MESMO
// domínio `Earnings` do CRUD (`earning-service.ts`) — mirror ESTRUTURAL de
// `BreedingMating/pregnant-cows-report-service.ts` (report ao lado do CRUD
// do próprio domínio, não em pasta separada).
//
// Resposta é SEMPRE binária `application/pdf`, `Content-Disposition: inline`
// — fora do envelope `ApiResponse` (`responseType: 'blob'`), mirror EXATO
// `downloadPregnantCowsReport`. `type` decide o FORMATO do cálculo (default
// `N` resolvido no backend), não é filtro de dado visível na tela.
// -----------------------------------------------------------------------------

import api from '@/services/api';

export interface MonthlyCalculationReportFilterParams {
  month: number;
  year: number;
  report_type: 1 | 2 | 3 | 4;
  type?: 'N' | 'A' | 'D';
  employee_uuids?: string[];
}

async function downloadMonthlyCalculationReport(
  params: MonthlyCalculationReportFilterParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/monthly-calculation-report',
    { ...params },
    {
      responseType: 'blob',
    }
  );
  return data;
}

export { downloadMonthlyCalculationReport };
