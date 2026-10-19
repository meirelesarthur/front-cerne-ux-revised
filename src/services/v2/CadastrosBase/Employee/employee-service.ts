// src/services/v2/CadastrosBase/Employee/employee-service.ts
// -----------------------------------------------------------------------------
// Employee Service — API v1 do backend Laravel GB.Cerne ("Funcionários").
// Fachada dedicada `/api/v1/employees` (Employee-contrato.md DA-EMP-02) —
// Employee é um PAPEL de Person, reaproveitando o upsert-por-nif de People
// por baixo do capô; este service NÃO importa nada de
// `@/services/v2/People` (independência arquitetural espelhando
// `EmployeeRequest`, DA-EMP-11).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /employees          → data: EmployeeListItem[], meta paginação
//                                 REAL (mesmo adaptador de listProviders/
//                                 listClients). Filtros server-side:
//                                 search/start_date/end_date/is_enabled
//                                 (DA-EMP-04, SEM filtro de FK).
//   GET    /employees/{uuid}   → data: EmployeeDetail — `{uuid}` é o uuid do
//                                 EMPLOYEE, NÃO o da Person.
//   POST   /employees          → payload CreateEmployeeRequest; `is_enabled`
//                                 NUNCA enviado pelo cliente (forçado `true`
//                                 no Controller, DA-EMP-11).
//   PUT    /employees/{uuid}   → payload UpdateEmployeeRequest — campos raiz
//                                 SEMPRE completos (full-resource-replace,
//                                 contrato `## 3.4`); `create_user`/
//                                 `role_uuid` NUNCA enviados (não existem no
//                                 form de edição).
//   PATCH  /employees/{uuid}/deactivate → 200 + EmployeeDetail; desativa
//                                 (`is_enabled:false`); permissão `employees_edit`.
//   PATCH  /employees/{uuid}/activate   → 204 sem corpo; reativa
//                                 (`is_enabled:true`); permissão `employees_edit`.
//   DELETE /employees/{uuid}   → 204; EXCLUI o registro (095, permissão
//                                 `employees_delete`). Com vínculos devolve
//                                 422 genérico (`errors:null`, `message`
//                                 traduzida) — a tela exibe a `message` no toast.
//
// Rota dentro de `farm.context` ESTRITO — `X-Farm-Id` é anexado
// automaticamente pelo interceptor genérico de `@/services/api.ts` (mesmo
// mecanismo de `provider-service.ts`); este service não manipula o header
// manualmente.
//
// Params SEMPRE repassados ao axios (checklist item 18 — nunca descartar
// `params` no service); `is_enabled` sempre via `??`, nunca `||` (checklist
// item 19 — descartaria o filtro "Inativo").
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateEmployeeRequest,
  EmployeeDetail,
  EmployeeListItem,
  EmployeeOption,
  EmployeeOptionsListEnvelope,
  EmployeesListEnvelope,
  UpdateEmployeeRequest,
} from '@/@types/v2/CadastrosBase/employee';

export interface ListEmployeesParams extends PaginationQueryParams {
  search?: string;
  start_date?: string;
  end_date?: string;
  is_enabled?: boolean;
}

async function listEmployees(
  params: ListEmployeesParams
): Promise<ResponsePagination<EmployeeListItem[]>> {
  const { data } = await api.V2.get<EmployeesListEnvelope>('/employees', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
    // `??` — NUNCA `||` (checklist item 19): `is_enabled === false` (filtro
    // "Inativo") é um valor válido e `||` o descartaria silenciosamente.
    is_enabled: params.is_enabled ?? undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de listProviders/listClients.
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

// `{uuid}` é o uuid do EMPLOYEE — NUNCA o uuid da Person.
async function getEmployeeByUuid(employeeUuid: string) {
  const { data } = await api.V2.get<Response<EmployeeDetail>>(`/employees/${employeeUuid}`);
  return data;
}

async function createEmployee(payload: CreateEmployeeRequest) {
  const { data } = await api.V2.post<Response<EmployeeDetail>>('/employees', payload);
  return data;
}

// Payload de update mantém os campos raiz SEMPRE completos (full-resource-
// replace, contrato `## 3.4`) — `create_user`/`role_uuid` nunca fazem parte
// do shape de update (`UpdateEmployeeRequest` os omite em tipo).
async function updateEmployee(employeeUuid: string, payload: UpdateEmployeeRequest) {
  const { data } = await api.V2.put<Response<EmployeeDetail>>(
    `/employees/${employeeUuid}`,
    payload
  );
  return data;
}

// Desativa o papel (`is_enabled:false`) via `PATCH /employees/{uuid}/deactivate`
// (095: `DELETE` agora EXCLUI; desativar tem rota própria, permissão
// `employees_edit`). Resposta 200 com `ApiResponse<EmployeeDetail>`.
async function deactivateEmployee(employeeUuid: string) {
  const { data } = await api.V2.patch<Response<EmployeeDetail>>(
    `/employees/${employeeUuid}/deactivate`
  );
  return data;
}

// Exclui o funcionário (`DELETE /employees/{uuid}`, 204). Com vínculos ativos a
// API responde 422 genérico (sem `errors`), e a `message` já vem traduzida.
async function deleteEmployee(employeeUuid: string): Promise<void> {
  await api.V2.delete(`/employees/${employeeUuid}`);
}

// Reativa o papel (`is_enabled:true`) via `PATCH /employees/{uuid}/activate`. Endpoint
// entregue em paralelo pela API (ficha `funcionarios-reativar-api.md`,
// esteira 090): `ApiResponse::noContent()` — 204 SEM corpo, mirror exato de
// `destroy()`/`DELETE`, NÃO o envelope `{data: Employee}` presumido na
// especificação inicial desta Tarefa. Por isso sem tipo genérico no `patch`
// (mesmo untyped de `deactivateEmployee` acima) — anotar `Response<
// EmployeeDetail>` aqui seria uma mentira de tipo sobre um corpo vazio.
async function activateEmployee(employeeUuid: string) {
  const { data } = await api.V2.patch(`/employees/${employeeUuid}/activate`);
  return data;
}

// -----------------------------------------------------------------------------
// GET /employees/options (CORRECAO-R1/D1, Onda 2, Execução 037) — lookup
// ENXUTO para o `SelectAsyncPaginate` de responsável (Devolução) e demais
// selects que puxam Employee, SEM gate de `employees_view` — roles com
// `devolution_create` mas sem `employees_view` recebiam 403 em `listEmployees`
// (`GET /employees`). Mirror EXATO de `listWarehouseOptions` (FLAT — a
// resposta NÃO é paginada, `ApiResponse::success`, `meta: null` sempre,
// `EmployeeOptionResource`: só `uuid`+`name`, `is_enabled=true`, farm-scoped).
// -----------------------------------------------------------------------------
export interface ListEmployeeOptionsParams extends PaginationQueryParams {
  search?: string;
}

async function listEmployeeOptions(
  params: ListEmployeeOptionsParams
): Promise<ResponsePagination<EmployeeOption[]>> {
  const { data } = await api.V2.get<EmployeeOptionsListEnvelope>('/employees/options', {
    search: params.search || undefined,
  });

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

export {
  activateEmployee,
  createEmployee,
  deactivateEmployee,
  deleteEmployee,
  getEmployeeByUuid,
  listEmployeeOptions,
  listEmployees,
  updateEmployee,
};
