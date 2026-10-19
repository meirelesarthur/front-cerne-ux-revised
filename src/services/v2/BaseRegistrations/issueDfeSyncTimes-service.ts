// src/services/v2/BaseRegistrations/issueDfeSyncTimes-service.ts
// -----------------------------------------------------------------------------
// Issue Dfe Sync Time Service — API v1 do backend Laravel GB.Cerne
// (Sincronização DFe / IssueDfeSyncTime).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /issue-dfe-sync-times                 → data: IssueDfeSyncTimeListItem[]
//                                                    + meta REAL de paginação
//                                                    (ApiResponse::paginated) —
//                                                    SEM filtro (`## 3` do
//                                                    contrato não documenta
//                                                    parâmetro de busca em
//                                                    `index()`, TASK-DFE-FE-01
//                                                    achado #3).
//   GET    /issue-dfe-sync-times/eligible-issuers → data:
//                                                    IssueDfeSyncTimeIssuerRef[],
//                                                    SEM paginação (DA-DFE-06).
//                                                    Alimenta o SelectCombobox
//                                                    (TASK-DFE-FE-02 achado
//                                                    #1/#2) — NÃO usar
//                                                    `page`/`per_page` aqui.
//   GET    /issue-dfe-sync-times/{uuid}           → data: IssueDfeSyncTimeDetail
//   POST   /issue-dfe-sync-times                  → payload
//                                                    IssueDfeSyncTimePayload
//                                                    (create)
//   PUT    /issue-dfe-sync-times/{uuid}            → payload
//                                                    IssueDfeSyncTimePayload
//                                                    (update — SEMPRE os 2
//                                                    campos, nunca delta)
//   DELETE /issue-dfe-sync-times/{uuid}            → 204 (sem guarda de
//                                                    dependência, DA-DFE-08)
//
// Recurso TENANT-SCOPED (`IssueDfeSyncTimeTenantScope`, DA-DFE-05) — exige
// `X-Farm-Id`, propagado automaticamente pelo interceptor axios global
// (`src/services/api.ts`), nenhum tratamento extra necessário aqui.
//
// Criado em TASK-DFE-FE-01 (listIssueDfeSyncTimes/deleteIssueDfeSyncTime).
// Completado em TASK-DFE-FE-02 (getIssueDfeSyncTime/createIssueDfeSyncTime/
// updateIssueDfeSyncTime/listEligibleIssuersForSync).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  IssueDfeSyncTimeDetail,
  IssueDfeSyncTimeIssuerRef,
  IssueDfeSyncTimeListItem,
  IssueDfeSyncTimePayload,
  IssueDfeSyncTimesListEnvelope,
} from '@/@types/v2/BaseRegistrations/issueDfeSyncTimes';

// Params aceitos pela listagem — SÓ paginação (sem filtro, achado #3 de
// TASK-DFE-FE-01 — o contrato não documenta nenhum parâmetro de busca).
export interface ListIssueDfeSyncTimesParams extends PaginationQueryParams {}

async function listIssueDfeSyncTimes(
  params: ListIssueDfeSyncTimesParams
): Promise<ResponsePagination<IssueDfeSyncTimeListItem[]>> {
  const { data } = await api.V2.get<IssueDfeSyncTimesListEnvelope>('/issue-dfe-sync-times', {
    page: params.page,
    per_page: params.per_page,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de listCategoryProducts/listLowReasons (meta REAL).
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

async function deleteIssueDfeSyncTime(uuid: string) {
  const { data } = await api.V2.delete(`/issue-dfe-sync-times/${uuid}`);
  return data;
}

// TASK-DFE-FE-02 — Select de Emissor elegível, endpoint NÃO-paginado
// (DA-DFE-06). Alimenta `useEligibleIssuersForSync` (1 fetch compartilhado),
// que por sua vez alimenta o `SelectCombobox` (busca client-side).
async function listEligibleIssuersForSync() {
  const { data } = await api.V2.get<Response<IssueDfeSyncTimeIssuerRef[]>>(
    '/issue-dfe-sync-times/eligible-issuers'
  );
  return data;
}

async function getIssueDfeSyncTime(uuid: string) {
  const { data } = await api.V2.get<Response<IssueDfeSyncTimeDetail>>(
    `/issue-dfe-sync-times/${uuid}`
  );
  return data;
}

async function createIssueDfeSyncTime(payload: IssueDfeSyncTimePayload) {
  const { data } = await api.V2.post<Response<IssueDfeSyncTimeDetail>>(
    '/issue-dfe-sync-times',
    payload
  );
  return data;
}

// Update envia o payload COMPLETO (issue_uuid+sync_hour SEMPRE presentes) —
// NÃO delta. `IssueDfeSyncTimeRequest::rules()` é unificado store/update,
// ambos os campos `required` nos dois verbos (DA-DFE-10).
async function updateIssueDfeSyncTime(uuid: string, payload: IssueDfeSyncTimePayload) {
  const { data } = await api.V2.put<Response<IssueDfeSyncTimeDetail>>(
    `/issue-dfe-sync-times/${uuid}`,
    payload
  );
  return data;
}

export {
  createIssueDfeSyncTime,
  deleteIssueDfeSyncTime,
  getIssueDfeSyncTime,
  listEligibleIssuersForSync,
  listIssueDfeSyncTimes,
  updateIssueDfeSyncTime,
};
