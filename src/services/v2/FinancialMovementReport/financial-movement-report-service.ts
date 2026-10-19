// src/services/v2/FinancialMovementReport/financial-movement-report-service.ts
// -----------------------------------------------------------------------------
// Financial Movement Report Service — API v1 do backend Laravel GB.Cerne
// ("Movimento Bancário", F-264, esteira 97-Esteiras/058, TASK-058-F264-FE-01).
//
// Endpoint ÚNICO — `format` decide PDF×Excel (fiel ao legado `type`,
// FID-15): `GET /financial-movement-report?...&format=pdf|xlsx`,
// `responseType:'blob'` (exceção documentada ao envelope `ApiResponse` — o
// relatório retorna binário puro; erros 401/403/422 seguem o Handler/envelope
// normalmente e chegam aqui como Blob, tratados por `parseBlobError` na
// tela).
//
// Permissão REUSA a canônica já existente `financial-movement-report_view`
// (nunca slug novo, já seeded) — gate de rota vive em `router/index.tsx`
// (`RequirePermission`)/`navigationPermissions.ts`, não neste service.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { FinancialMovementReportParams } from '@/@types/v2/FinancialMovementReport';

async function downloadFinancialMovementReport(
  params: FinancialMovementReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/financial-movement-report',
    {
      accounts: params.accounts && params.accounts.length > 0 ? params.accounts : undefined,
      proprietary: params.proprietary || undefined,
      types: params.types && params.types.length > 0 ? params.types : undefined,
      center_id: params.center_id || undefined,
      categories: params.categories && params.categories.length > 0 ? params.categories : undefined,
      farm_id: params.farm_id || undefined,
      condition: params.condition || undefined,
      start_date: params.start_date,
      end_date: params.end_date,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadFinancialMovementReport };
