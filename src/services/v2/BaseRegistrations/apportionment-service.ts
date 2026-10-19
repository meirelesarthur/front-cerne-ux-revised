// src/services/v2/BaseRegistrations/apportionment-service.ts
// -----------------------------------------------------------------------------
// Apportionment Service ("Rateio - Categoria Financeira") — API v1 do backend
// Laravel GB.Cerne. TASK-AP-FE-05 (fundação/ESQUELETO — os endpoints
// `/api/v1/apportionments*` estão `APROVADO` em contrato, mas a camada `api`
// do backend AINDA NÃO foi implementada/homologada. Esta Tarefa cria o
// ESQUELETO do service — funções + paths + shapes de request/response — SEM
// prova real de request/response). Grupo de rota `farm.context` (DA-AP-01) —
// `X-Farm-Id` propagado automaticamente pelo interceptor de `@/services/api`,
// nenhuma lógica extra aqui (mirror `cost-center-service.ts`).
//
// Contrato (Apportionment-contrato.md ## 3, envelope ApiResponse):
//   GET    /apportionments                                          → index (paginado, filtro `search`)
//   GET    /apportionments/{uuid}                                   → show
//   POST   /apportionments                                          → store (payload ApportionmentPayload)
//   PUT    /apportionments/{uuid}                                    → update (payload ApportionmentPayload)
//   DELETE /apportionments/{uuid}                                    → destroy
//   GET    /apportionments/eligible-financial-categories             → leitura auxiliar (DA-AP-04, `?exclude=`)
//   GET    /apportionments/eligible-activities                       → leitura auxiliar (DA-AP-05)
//   GET    /apportionments/eligible-cost-centers                     → leitura auxiliar (DA-AP-07)
//   GET    /apportionments/activities/{activityUuid}/available-ha    → leitura auxiliar (DA-AP-06, `?exclude_apportionment_id=`)
//
// `listApportionments` ADAPTA o envelope paginado do backend ({ data: [],
// meta: {} }) para o shape `ResponsePagination` ({ data: { items,
// pagination } }) que a infra de grid do projeto (useCustomGridQuery/
// TableProvider) consome — mesmo truque de `listCostCenters`/
// `listDiagnosisPregnancies`.
//
// [RISCO herdado de TASK-AP-FE-01] Payload de escrita usa os nomes do Form
// Request, não do DTO — `createApportionment`/`updateApportionment` recebem
// `ApportionmentPayload` (já com os nomes corretos, `financial_category_id`/
// `items[].activity_id`/`items[].centers[].center_id`).
//
// [RISCO] Sem API real para testar contra. Os paths abaixo são copiados
// literalmente de `Apportionment-contrato.md ## 3` — se a implementação real
// da API divergir no momento da integração (trailing slash, nome de query
// param), a Tarefa pós-API corrige; esta Tarefa não pode confirmar isso agora
// (SEM MOCK — não finjo uma resposta, só declaro os paths do contrato
// aprovado).
//
// [DECISÃO] `listEligibleFinancialCategories`/`listEligibleActivities`/
// `listEligibleCostCenters`/`getAvailableHaForActivity` são funções NOVAS e
// DEDICADAS deste service — NÃO reaproveitam `listFinancialCategoryOptions`/
// `listCostCenterOptions` (genéricos, já existentes) porque a elegibilidade
// aqui tem regra de negócio própria e não-genérica (DA-AP-04/05/07: classe
// SYNTHETIC, hierarquia por tenant, exclusão de categoria já vinculada,
// filtro `1.01.%`) — reaproveitar o genérico devolveria uma lista ERRADA.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ApportionmentData,
  ApportionmentFilterRequest,
  ApportionmentPayload,
  ApportionmentsListEnvelope,
  EligibleActivity,
} from '@/@types/v2/BaseRegistrations/apportionment';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';

// Params aceitos pela listagem — paginação padrão + filtro `search` (## 3).
export interface ListApportionmentsParams
  extends PaginationQueryParams, ApportionmentFilterRequest {}

// ---- CRUD ----

async function listApportionments(
  params: ListApportionmentsParams
): Promise<ResponsePagination<ApportionmentData[]>> {
  const { data } = await api.V2.get<ApportionmentsListEnvelope>('/apportionments', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid).
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

async function getApportionment(apportionmentUuid: string) {
  const { data } = await api.V2.get<Response<ApportionmentData>>(
    `/apportionments/${apportionmentUuid}`
  );
  return data;
}

async function createApportionment(payload: ApportionmentPayload) {
  const { data } = await api.V2.post<Response<ApportionmentData>>('/apportionments', payload);
  return data;
}

async function updateApportionment(apportionmentUuid: string, payload: ApportionmentPayload) {
  const { data } = await api.V2.put<Response<ApportionmentData>>(
    `/apportionments/${apportionmentUuid}`,
    payload
  );
  return data;
}

async function deleteApportionment(apportionmentUuid: string) {
  const { data } = await api.V2.delete(`/apportionments/${apportionmentUuid}`);
  return data;
}

// ---- Leituras auxiliares (## 3, DA-AP-04/05/06/07) ----

async function listEligibleFinancialCategories(params?: { exclude?: string }) {
  const { data } = await api.V2.get<Response<FinancialCategoryOption[]>>(
    '/apportionments/eligible-financial-categories',
    { exclude: params?.exclude || undefined }
  );
  return data;
}

async function listEligibleActivities() {
  const { data } = await api.V2.get<Response<EligibleActivity[]>>(
    '/apportionments/eligible-activities'
  );
  return data;
}

async function listEligibleCostCenters() {
  const { data } = await api.V2.get<Response<CostCenterRef[]>>(
    '/apportionments/eligible-cost-centers'
  );
  return data;
}

async function getAvailableHaForActivity(
  activityUuid: string,
  params?: { exclude_apportionment_id?: string }
) {
  const { data } = await api.V2.get<Response<{ available_ha: number }>>(
    `/apportionments/activities/${activityUuid}/available-ha`,
    { exclude_apportionment_id: params?.exclude_apportionment_id || undefined }
  );
  return data;
}

export {
  createApportionment,
  deleteApportionment,
  getApportionment,
  getAvailableHaForActivity,
  listApportionments,
  listEligibleActivities,
  listEligibleCostCenters,
  listEligibleFinancialCategories,
  updateApportionment,
};
