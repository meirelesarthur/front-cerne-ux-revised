// src/services/v2/Relatorios/production-per-worker-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Prod./Colaborador" (F-300, `ProductionPerWorkerReportController`,
// lote 079, F-300-plano-frontend.md TASK-300-FE-02) — mirror EXATO de
// `production-costing-area-report-service.ts` (F-298).
//
// Endpoints confirmados por leitura DIRETA de
// `GB.Cerne.Api/app/Http/Controllers/Api/V1/ProductionPerWorkerReportController.php`
// e `routes/api.php:1785-1788`:
//   - `GET /api/v1/production-per-worker-report/options` — envelope
//     `{success,message,data,errors,meta}`, `data.teams`/`data.employees`/
//     `data.areas`/`data.production_cycles` (1 único payload, 4 lookups).
//   - `GET /api/v1/production-per-worker-report` — PDF binário, SEM
//     envelope (mesma exceção documentada em `dre-report-service.ts`/
//     `production-costing-area-report-service.ts`), `responseType:'blob'`
//     obrigatório.
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
//
// `production_cycle` NUNCA entra no payload do download (client-only,
// §B.2 do plano — a Request real da API não tem esse campo).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  ProductionPerWorkerReportOptionsData,
  ProductionPerWorkerReportParams,
} from '@/@types/v2/Relatorios/production-per-worker-report';

interface ProductionPerWorkerReportOptionsResponse {
  teams: ProductionPerWorkerReportOptionsData['teams'];
  employees: ProductionPerWorkerReportOptionsData['employees'];
  areas: ProductionPerWorkerReportOptionsData['areas'];
  production_cycles: ProductionPerWorkerReportOptionsData['productionCycles'];
}

async function getProductionPerWorkerReportOptions(): Promise<ProductionPerWorkerReportOptionsData> {
  const { data } = await api.V2.get<Response<ProductionPerWorkerReportOptionsResponse>>(
    '/production-per-worker-report/options'
  );
  return {
    teams: data.data.teams,
    employees: data.data.employees,
    areas: data.data.areas,
    productionCycles: data.data.production_cycles,
  };
}

async function downloadProductionPerWorkerReportPdf(
  params: ProductionPerWorkerReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/production-per-worker-report',
    {
      team_uuids: params.team_uuids?.length ? params.team_uuids : undefined,
      area_uuids: params.area_uuids?.length ? params.area_uuids : undefined,
      employee_uuids: params.employee_uuids?.length ? params.employee_uuids : undefined,
      start_date: params.start_date,
      end_date: params.end_date,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadProductionPerWorkerReportPdf, getProductionPerWorkerReportOptions };
