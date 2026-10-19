// src/services/v2/Dashboards/abcIndicators-service.ts
// Service da dashboard Programa ABC Corte (execução 046, TASK-ABC-FE-02).
//
//   GET /api/v1/dashboards/abc-indicators?harvest_uuid&grazing_uuid&start_date&end_date
//     → data: AbcIndicatorsData (agregado NÃO paginado, 14 campos, DEC-183)
//
// A cascata Safra→datas (`ABC-CASCADE-01`) REUSA `getHarvest` (`GET
// /harvests/{uuid}`, já migrado) — nenhum endpoint novo, ver
// `CONTRATO-API-046-04-abc-indicators.md §1`.

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  AbcIndicatorsData,
  AbcIndicatorsFilterRequest,
} from '@/@types/v2/Dashboards/abcIndicators';

async function getAbcIndicators(
  params: AbcIndicatorsFilterRequest
): Promise<Response<AbcIndicatorsData>> {
  const { data } = await api.V2.get<Response<AbcIndicatorsData>>('/dashboards/abc-indicators', {
    harvest_uuid: params.harvest_uuid,
    grazing_uuid: params.grazing_uuid,
    start_date: params.start_date,
    end_date: params.end_date,
  });
  return data;
}

export { getAbcIndicators };
