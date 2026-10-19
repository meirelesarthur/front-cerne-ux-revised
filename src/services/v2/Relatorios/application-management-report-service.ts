// src/services/v2/Relatorios/application-management-report-service.ts
// -----------------------------------------------------------------------------
// Relatório "Aplicação/Manejo" (F-230, esteira 97-Esteiras/077,
// F-230-plano-front.md §4) — mirror ESTRUTURAL de
// `costing-livestock-area-report-service.ts` (F-251), REMOVENDO `grazings`.
//
// Endpoints (`F-230-plano-front.md` §Contrato API, ✅):
//   - `GET /api/v1/application-management-report/options` — envelope
//     `{success,message,data,errors,meta}`, `data.production_cycles`/
//     `data.areas` (mirror `getCostingLivestockAreaReportOptions`).
//   - `GET /api/v1/application-management-report` — PDF binário como
//     attachment (SEM envelope), `responseType:'blob'` obrigatório.
//
// SEM `farm_id`/`X-Farm-Id` explícito no payload — o client já injeta o
// header automaticamente (`get_spa_api_client_pattern §2`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  ApplicationManagementReportOptionsData,
  ApplicationManagementReportParams,
} from '@/@types/v2/Relatorios/application-management-report';

interface ApplicationManagementReportOptionsResponse {
  production_cycles: ApplicationManagementReportOptionsData['productionCycles'];
  areas: ApplicationManagementReportOptionsData['areas'];
}

async function getApplicationManagementReportOptions(): Promise<ApplicationManagementReportOptionsData> {
  const { data } = await api.V2.get<Response<ApplicationManagementReportOptionsResponse>>(
    '/application-management-report/options'
  );
  return {
    productionCycles: data.data.production_cycles,
    areas: data.data.areas,
  };
}

async function downloadApplicationManagementReportPdf(
  params: ApplicationManagementReportParams
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(
    '/application-management-report',
    {
      production_cycle_uuid: params.production_cycle_uuid || undefined,
      area_uuids: params.area_uuids?.length ? params.area_uuids : undefined,
      start_date: params.start_date,
      end_date: params.end_date,
    },
    { responseType: 'blob' }
  );
  return data;
}

export { downloadApplicationManagementReportPdf, getApplicationManagementReportOptions };
