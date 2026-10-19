// src/services/v2/Relatorios/total-cost-of-reproduction-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Custo Total de Reprodução" (F-328, esteira
// CORE_WORKSPACE/97-Esteiras/008, TASK-FE-CTR-01) — mirror ESTRUTURAL de
// `nutrition-consumption-report-service.ts` (F-288).
//
// Endpoint confirmado por leitura DIRETA de
// `GB.Cerne.Api/app/Http/Controllers/Api/V1/TotalCostOfReproductionReportController.php`
// e `routes/api.php:1453-1454`:
//   - `GET /api/v1/total-cost-of-reproduction-report` — resposta BINÁRIA
//     (`application/pdf` `inline` OU `.xlsx`), **fora** do envelope
//     `ApiResponse` (exceção documentada, como os 58 relatórios do fork).
//     `responseType:'blob'` obrigatório. `format` decide o FORMATO da MESMA
//     resposta — **não** filtra dado.
//   - **Síncrono.** Sem 202, sem `AsyncJob`, sem polling.
//   - **Sem `/options`.** Nenhuma query de opções — o único select
//     (`format`) é estático (`reportFormatOptions`).
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente via interceptor (`src/services/api.ts:69`,
// `get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { TotalCostOfReproductionReportParams } from '@/@types/v2/Relatorios/total-cost-of-reproduction-report';

async function downloadTotalCostOfReproductionReport(
  params: TotalCostOfReproductionReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/total-cost-of-reproduction-report',
    {
      start_date: params.start_date,
      end_date: params.end_date,
      format: params.format,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadTotalCostOfReproductionReport };
