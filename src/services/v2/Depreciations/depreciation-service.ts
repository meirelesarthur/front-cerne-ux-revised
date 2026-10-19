// src/services/v2/Depreciations/depreciation-service.ts
// -----------------------------------------------------------------------------
// Depreciation Service — API v1 do backend Laravel GB.Cerne (Depreciação
// Mensal / Depreciação Animal, execução 027). Contrato:
// Depreciation-Frontend-Contrato.md §5/§8 + Depreciation-contrato.md
// (backend, APROVADO) §5/§8.
//
//   GET  /depreciations           → data: DepreciationEquipmentListItem[],
//                                    meta com paginação REAL, per_page
//                                    default 10, teto 100 (filtros
//                                    `equipment_uuid`/`year`/`month`)
//   GET  /depreciation-animals    → data: DepreciationAnimalListItem[], idem
//                                    (filtros `year`/`month` — `animal_uuid`
//                                    fora de escopo, ver §8.2 do contrato)
//   POST /depreciations/generate  → payload DepreciationGeneratePayload
//                                    (`type=equipment|animal|all`; fazenda
//                                    vem do header X-Farm-Id, injetado
//                                    globalmente pelo interceptor axios —
//                                    NUNCA no payload)
//
// `listDepreciations`/`listDepreciationAnimals` ADAPTAM o envelope
// { data: [], meta: {} } para o shape `ResponsePagination` que
// `useCustomGridQuery`/`TableProvider` consomem — mesmo adaptador de
// `listEquipments`/`listCostCenters` (meta REAL, não fallback fake).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  DepreciationAnimalFilterForm,
  DepreciationAnimalListItem,
  DepreciationAnimalsListEnvelope,
  DepreciationEquipmentListItem,
  DepreciationFilterForm,
  DepreciationGeneratePayload,
  DepreciationGenerateResult,
  DepreciationsListEnvelope,
} from '@/@types/v2/Depreciations';

export interface ListDepreciationsParams
  extends
    PaginationQueryParams,
    Pick<DepreciationFilterForm, 'equipment_uuid' | 'year' | 'month'> {}

async function listDepreciations(
  params: ListDepreciationsParams
): Promise<ResponsePagination<DepreciationEquipmentListItem[]>> {
  const { data } = await api.V2.get<DepreciationsListEnvelope>('/depreciations', {
    page: params.page,
    per_page: params.per_page,
    equipment_uuid: params.equipment_uuid || undefined,
    year: params.year || undefined,
    month: params.month || undefined,
  });

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

export interface ListDepreciationAnimalsParams
  extends PaginationQueryParams, Pick<DepreciationAnimalFilterForm, 'year' | 'month'> {}

async function listDepreciationAnimals(
  params: ListDepreciationAnimalsParams
): Promise<ResponsePagination<DepreciationAnimalListItem[]>> {
  const { data } = await api.V2.get<DepreciationAnimalsListEnvelope>('/depreciation-animals', {
    page: params.page,
    per_page: params.per_page,
    year: params.year || undefined,
    month: params.month || undefined,
  });

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// Fazenda vem SEMPRE de X-Farm-Id (interceptor axios global) — jamais no
// payload (contrato de API §4c / task-packet, "nunca do payload").
async function generateDepreciation(payload: DepreciationGeneratePayload) {
  const { data } = await api.V2.post<Response<DepreciationGenerateResult>>(
    '/depreciations/generate',
    payload
  );
  return data;
}

export { generateDepreciation, listDepreciationAnimals, listDepreciations };
