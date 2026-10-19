// src/services/v2/Advances/advance-service.ts
// -----------------------------------------------------------------------------
// Advance Service — API v1 do backend Laravel GB.Cerne (Adiantamento
// Salarial). TASK-FE-adiant-salarial (97-Esteiras/034). Mirror estrutural de
// `production-cycle-service.ts` (mesmo adaptador do envelope paginado real
// `ApiResponse::paginated` → `ResponsePagination`, consumido pela grid via
// `useCustomGridQuery`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /advances              → data: Advance[] + meta paginação real
//                                    (filtro employee_uuid, AdvanceFilterData)
//   GET    /advances/{uuid}       → data: Advance
//   POST   /advances              → payload AdvancePayload (201)
//   PUT    /advances/{uuid}       → payload AdvancePayload — FULL REPLACE
//                                    (os 5 campos são `required` no backend,
//                                    FE-FORM-MODE — NUNCA enviar patch parcial)
//   DELETE /advances/{uuid}       → 204 soft delete
//
// D2-REV (TASK-FE-FINANCEIRO-adiant, 97-Esteiras/034) — a dimensão
// financeira ("Gerar Financeiro", has_financial + financial{...}) deixou de
// estar fora de escopo: `AdvancePayload` agora inclui `has_financial` +
// `financial` (opcional, presente só quando `has_financial=true`). Este
// service permanece um passthrough burro — nenhuma lógica de payload aqui,
// só o adaptador de envelope/paginação (a montagem do `financial` acontece
// em `CreateOrUpdateAdiantamento.tsx`, `tryPersistAdvance`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type { Advance, AdvancePayload, AdvancesListEnvelope } from '@/@types/v2/Advances';

// Params aceitos pela listagem — paginação real + filtro `employee_uuid`
// (único filtro do backend, `AdvanceFilterData`).
export interface ListAdvancesParams extends PaginationQueryParams {
  employee_uuid?: string;
}

async function listAdvances(params: ListAdvancesParams): Promise<ResponsePagination<Advance[]>> {
  const { data } = await api.V2.get<AdvancesListEnvelope>('/advances', {
    page: params.page,
    per_page: params.per_page,
    employee_uuid: params.employee_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de `listProductionCycles`/`listEvents`.
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

async function getAdvanceByUuid(advanceUuid: string): Promise<Response<Advance>> {
  const { data } = await api.V2.get<Response<Advance>>(`/advances/${advanceUuid}`);
  return data;
}

async function createAdvance(payload: AdvancePayload): Promise<Response<Advance>> {
  const { data } = await api.V2.post<Response<Advance>>('/advances', payload);
  return data;
}

// Full-replace (FE-FORM-MODE) — os 5 campos SEMPRE completos, nunca patch
// parcial por dirtyFields (o backend valida os 5 como `required` também no
// update, dado o acoplamento amount↔installments).
async function updateAdvance(
  advanceUuid: string,
  payload: AdvancePayload
): Promise<Response<Advance>> {
  const { data } = await api.V2.put<Response<Advance>>(`/advances/${advanceUuid}`, payload);
  return data;
}

async function deleteAdvance(advanceUuid: string) {
  const { data } = await api.V2.delete(`/advances/${advanceUuid}`);
  return data;
}

export { createAdvance, deleteAdvance, getAdvanceByUuid, listAdvances, updateAdvance };
