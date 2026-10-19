// src/services/v2/Financeiro/budget-planning-service.ts
// -----------------------------------------------------------------------------
// BudgetPlanning Service — API v1 do backend Laravel GB.Cerne ("Prev.
// Orçamentária", F-106, esteira 97-Esteiras/067, TASK-PO-FE-05). Mirror
// estrutural de `@/services/v2/Financeiro/Expenses/expense-service.ts` (mesmo
// formato de cabeçalho, mesma adaptação de paginação `ResponsePagination`).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /budget-plannings/template          → blob (XLS), SEM envelope
//                                                (rota ESTÁTICA — declarada
//                                                ANTES de `{uuid}` no
//                                                backend, ver routes/api.php).
//   POST   /budget-plannings/import             → 201/422, data:
//                                                BudgetPlanningData
//                                                (multipart, sempre cria
//                                                novo, tudo-ou-nada).
//   GET    /budget-plannings/predicted-report    → blob (PDF/XLSX), SEM
//                                                envelope (rota ESTÁTICA).
//   GET    /budget-plannings                    → paginado, data:
//                                                BudgetPlanningListData[].
//   POST   /budget-plannings                    → 201, data: BudgetPlanningData.
//   GET    /budget-plannings/{uuid}              → show (hidratação edit).
//   GET    /budget-plannings/{uuid}/export       → blob (XLS), SEM envelope.
//   PUT    /budget-plannings/{uuid}              → 200, data: BudgetPlanningData.
//   DELETE /budget-plannings/{uuid}              → hard delete (sem soft
//                                                delete, sem corpo útil).
//
// Rota dentro do grupo `auth:sanctum` + `farm.context` — `X-Farm-Id` é
// anexado automaticamente pelo interceptor genérico de `@/services/api.ts`.
//
// `getAllBudgetPlannings` ADAPTA o envelope paginado do backend para o
// shape `ResponsePagination` que a infra de grid (useCustomGridQuery/
// TableProvider) consome — mesmo adaptador de `listExpenses`/
// `listFinancialFreezes`.
//
// ⚠️ `downloadBudgetPlanningTemplate`/`exportBudgetPlanning`/
// `downloadBudgetPlanningPredictedReport` retornam binário — `responseType:
// 'blob'`, NUNCA desempacotados como envelope (exceção deliberada,
// confirmado no Controller real, `BudgetPlanningController`).
//
// ✅ GAP-PO-08 RESOLVIDO (TASK-PO-FE-07) — `listEligibleBudgetPlanningCategories`
// consome `GET /budget-plannings/eligible-categories` (rota ESTÁTICA,
// declarada ANTES de `{uuid}` em `routes/api.php`, permissão
// `budget-plannings_view`, resource `BudgetPlanningEligibleCategoryResource`
// — confirmado em código real, `BudgetPlanningController::eligibleCategories`).
// Devolve o MESMO universo de categorias elegíveis usado por
// template/import — a grade mensal do formulário criar/editar (1 linha por
// categoria elegível, com ou sem valor) usa esta função.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  BudgetPlanningData,
  BudgetPlanningEligibleCategory,
  BudgetPlanningFilterRequest,
  BudgetPlanningListData,
  BudgetPlanningPredictedReportRequest,
  BudgetPlanningsListEnvelope,
  CreateOrUpdateBudgetPlanningRequest,
  ImportBudgetPlanningRequest,
} from '@/@types/v2/Financeiro/budgetPlanning';

const BASE = '/budget-plannings';

export interface ListBudgetPlanningsParams
  extends PaginationQueryParams, BudgetPlanningFilterRequest {}

async function getAllBudgetPlannings(
  params: ListBudgetPlanningsParams
): Promise<ResponsePagination<BudgetPlanningListData[]>> {
  const { data } = await api.V2.get<BudgetPlanningsListEnvelope>(BASE, {
    page: params.page,
    per_page: params.per_page,
    year: params.year ?? undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mirror `listExpenses`/`listFinancialFreezes`. `total_pages` vem de
  // `meta.last_page`, NÃO `meta.total_pages`.
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

async function getBudgetPlanning(budgetPlanningUuid: string) {
  const { data } = await api.V2.get<Response<BudgetPlanningData>>(`${BASE}/${budgetPlanningUuid}`);
  return data;
}

async function createBudgetPlanning(payload: CreateOrUpdateBudgetPlanningRequest) {
  const { data } = await api.V2.post<Response<BudgetPlanningData>>(BASE, payload);
  return data;
}

async function updateBudgetPlanning(
  budgetPlanningUuid: string,
  payload: CreateOrUpdateBudgetPlanningRequest
) {
  const { data } = await api.V2.put<Response<BudgetPlanningData>>(
    `${BASE}/${budgetPlanningUuid}`,
    payload
  );
  return data;
}

// Hard delete (sem soft delete, fiel ao legado) — sem corpo útil.
async function deleteBudgetPlanning(budgetPlanningUuid: string) {
  const { data } = await api.V2.delete(`${BASE}/${budgetPlanningUuid}`);
  return data;
}

// ---- Import/Template (rotas ESTÁTICAS — SEMPRE declaradas/chamadas ANTES
// de qualquer helper que monte `/{uuid}`, evita colisão de rota) ----

async function downloadBudgetPlanningTemplate(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`${BASE}/template`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// Multipart — `year` no corpo do FormData (o import usa esse ano, não o da
// planilha, mirror contrato de tela §8). Tudo-ou-nada (201 ou 422, SEM
// sucesso parcial) — diferente do contrato de `ImportExportActions.tsx`
// (Expense/Income), não reaproveitar aquele componente aqui.
async function importBudgetPlanning({ file, year }: ImportBudgetPlanningRequest) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('year', String(year));

  const { data } = await api.V2.post<Response<BudgetPlanningData>>(`${BASE}/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ---- Export (1 registro) ----

async function exportBudgetPlanning(budgetPlanningUuid: string): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`${BASE}/${budgetPlanningUuid}/export`, undefined, {
    responseType: 'blob',
  });
  return data;
}

// ---- Relatório Previsto×Realizado ----
// Rodada 3 (esteira 065, item 1.a/1.b) — REVERTE o `GAP-PO-04` registrado
// acima: a API agora aceita `farm_uuid` (tenant-scoped, opcional) no
// querystring, escopando o relatório pela fazenda selecionada. Sem seleção,
// `farm_uuid` vai `undefined` e o backend cai no fallback `X-Farm-Id`
// (anexado automaticamente pelo interceptor) — comportamento inalterado.

async function downloadBudgetPlanningPredictedReport(
  params: BudgetPlanningPredictedReportRequest
): Promise<Blob> {
  const { data } = await api.V2.get<Blob>(`${BASE}/predicted-report`, params, {
    responseType: 'blob',
  });
  return data;
}

// ---- Categorias elegíveis para a grade (GAP-PO-08 resolvido, TASK-PO-FE-07)
// ----
// Rota ESTÁTICA (declarada ANTES de `{uuid}` no backend) — universo completo
// de categorias elegíveis (folha, habilitada, alcançável pelos Centros de
// Custo do tenant), COM ou SEM valor salvo. Consumido pelo formulário
// criar/editar (`CreateOrUpdateBudgetPlanning.tsx`) para montar 1 linha por
// categoria elegível — `BudgetPlanningResource.categories` (usado em
// `getBudgetPlanning`) só devolve categorias com pivot já existente.
async function listEligibleBudgetPlanningCategories() {
  const { data } = await api.V2.get<Response<BudgetPlanningEligibleCategory[]>>(
    `${BASE}/eligible-categories`
  );
  return data;
}

export {
  createBudgetPlanning,
  deleteBudgetPlanning,
  downloadBudgetPlanningPredictedReport,
  downloadBudgetPlanningTemplate,
  exportBudgetPlanning,
  getAllBudgetPlannings,
  getBudgetPlanning,
  importBudgetPlanning,
  listEligibleBudgetPlanningCategories,
  updateBudgetPlanning,
};
