// src/services/v2/Configuracoes/Help/help-service.ts
// -----------------------------------------------------------------------------
// Help Service — API v1 do backend Laravel GB.Cerne (Tutoriais, TASK-HP-06).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /helps                → data: HelpData[] + meta de paginação
//                                   (ApiResponse::paginated), filtro
//                                   OPCIONAL `permission_uuid`
//   GET    /helps/{uuid}         → data: HelpData
//   POST   /helps                → payload CreateHelpRequest
//   PATCH  /helps/{uuid}         → payload UpdateHelpRequest (campos
//                                   opcionais — `sometimes` no backend,
//                                   Help-contrato §4.2)
//   DELETE /helps/{uuid}         → 204 (sem guarda de FK — nada referencia
//                                   `helps.id`, Help-contrato §4.4)
//
// Catálogo GLOBAL (Help-contrato §6) — SEM `farm_id`/`tenant_id`. NÃO
// construir filtro/estado por fazenda; o header `X-Farm-Id` continua sendo
// propagado pelo interceptor axios global, mas o backend o ignora aqui.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateHelpRequest,
  HelpData,
  HelpsListEnvelope,
  UpdateHelpRequest,
} from '@/@types/v2/Configuracoes/help';

// Params aceitos pela listagem — paginação + filtro opcional por tela
// (`permission_uuid`, Help-contrato §5).
export interface ListHelpsParams extends PaginationQueryParams {
  permission_uuid?: string;
}

async function getAllHelps(params: ListHelpsParams): Promise<ResponsePagination<HelpData[]>> {
  const { data } = await api.V2.get<HelpsListEnvelope>('/helps', {
    page: params.page,
    per_page: params.per_page,
    permission_uuid: params.permission_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de listCostCenters/listIssueDfeSyncTimes (meta REAL).
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function getHelpByUuid(uuid: string) {
  const { data } = await api.V2.get<Response<HelpData>>(`/helps/${uuid}`);
  return data;
}

async function createHelp(payload: CreateHelpRequest) {
  const { data } = await api.V2.post<Response<HelpData>>('/helps', payload);
  return data;
}

async function updateHelp(uuid: string, payload: UpdateHelpRequest) {
  const { data } = await api.V2.patch<Response<HelpData>>(`/helps/${uuid}`, payload);
  return data;
}

async function deleteHelp(uuid: string) {
  const { data } = await api.V2.delete(`/helps/${uuid}`);
  return data;
}

export { createHelp, deleteHelp, getAllHelps, getHelpByUuid, updateHelp };
