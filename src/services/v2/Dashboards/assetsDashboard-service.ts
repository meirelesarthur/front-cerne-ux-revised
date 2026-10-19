// src/services/v2/Dashboards/assetsDashboard-service.ts
// Service da dashboard Ativos (execução 046, TASK-AT-FE-02).
//
//   GET /api/v1/dashboards/assets?months=3|6|12&family_uuids[]&status&proprietary_uuid
//     → data: AssetsDashboardData (agregado NÃO paginado)
//
// Lookups de família/status/proprietário REUSAM os endpoints já migrados
// (`listFamilyEquipmentOptions`/`listProprietaryOptions`) — este service não
// duplica lookup nenhum (`03-CONTRATO-TELA-assets-dashboard.md §4`).
// `X-Farm-Id` anexado automaticamente pelo interceptor de `@/services/api.ts`.

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  AssetsDashboardData,
  AssetsDashboardFilterRequest,
} from '@/@types/v2/Dashboards/assetsDashboard';

async function getAssetsDashboard(
  params: AssetsDashboardFilterRequest
): Promise<Response<AssetsDashboardData>> {
  const { data } = await api.V2.get<Response<AssetsDashboardData>>('/dashboards/assets', {
    months: params.months,
    family_uuids: params.family_uuids,
    status: params.status,
    proprietary_uuid: params.proprietary_uuid,
  });
  return data;
}

export { getAssetsDashboard };
