// src/services/v2/Functions/function-service.ts
// -----------------------------------------------------------------------------
// Function (CBO) Service — API v1 do backend Laravel GB.Cerne. Service NOVO e
// MÍNIMO (TASK-FE-300/TASK-BE-332) — só o necessário para popular o
// `SelectAsyncPaginate` de `employee.function_uuid` no wizard de Pessoas.
// Mirror estrutural de `bank-service.ts`/`role-service.ts` (adaptação do
// envelope paginado real para `ResponsePagination`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateFunctionRequest,
  FunctionDetail,
  FunctionOption,
  FunctionOptionsListEnvelope,
  FunctionsListEnvelope,
  UpdateFunctionRequest,
} from '@/@types/v2/Functions';

export interface ListFunctionOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listFunctionOptions(
  params: ListFunctionOptionsParams
): Promise<ResponsePagination<FunctionOption[]>> {
  const { data } = await api.V2.get<FunctionOptionsListEnvelope>('/functions/options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

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

// -----------------------------------------------------------------------------
// CRUD completo (TASK-FN-FE-01/02) — ADICIONADO, `listFunctionOptions` acima
// permanece INTOCADO (exclusivo do wizard de Pessoas, TASK-FE-300/303).
// -----------------------------------------------------------------------------

// Params aceitos pela listagem — paginação padrão + busca (`name`, DA-FN-15)
// + filtros reais do backend (`is_enabled`/`cbo_uuid`). Checklist item 3:
// `is_enabled` SEMPRE stringificado explicitamente antes de ir para a
// querystring (a querystring HTTP só carrega string).
export interface ListFunctionsParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: boolean | 'true' | 'false';
  cbo_uuid?: string;
}

async function listFunctions(
  params: ListFunctionsParams
): Promise<ResponsePagination<FunctionDetail[]>> {
  const { data } = await api.V2.get<FunctionsListEnvelope>('/functions', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    // `??` — NUNCA `||` (checklist item 19): `is_enabled === false` (filtro
    // "Inativo") é um valor válido e `||` o descartaria silenciosamente.
    is_enabled: params.is_enabled !== undefined ? String(params.is_enabled) : undefined,
    cbo_uuid: params.cbo_uuid || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo padrão de `listMarkers`/`listFamilyEquipments`.
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

async function deleteFunction(uuid: string) {
  const { data } = await api.V2.delete(`/functions/${uuid}`);
  return data;
}

// -----------------------------------------------------------------------------
// Formulário create/edit (TASK-FN-FE-02) — mirror exato de
// `cost-center-service.ts` (getCostCenter/createCostCenter/updateCostCenter).
// -----------------------------------------------------------------------------

async function getFunction(uuid: string): Promise<Response<FunctionDetail>> {
  const { data } = await api.V2.get<Response<FunctionDetail>>(`/functions/${uuid}`);
  return data;
}

async function createFunction(body: CreateFunctionRequest): Promise<Response<FunctionDetail>> {
  const { data } = await api.V2.post<Response<FunctionDetail>>('/functions', body);
  return data;
}

async function updateFunction(
  uuid: string,
  body: UpdateFunctionRequest
): Promise<Response<FunctionDetail>> {
  const { data } = await api.V2.put<Response<FunctionDetail>>(`/functions/${uuid}`, body);
  return data;
}

export {
  createFunction,
  deleteFunction,
  getFunction,
  listFunctionOptions,
  listFunctions,
  updateFunction,
};
