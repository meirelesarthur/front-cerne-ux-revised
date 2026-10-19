// src/services/v2/Integrations/integration-dominio-service.ts
// -----------------------------------------------------------------------------
// Service de Software Domínio (IntegrationDominio) — Integrações, F-121,
// 97-Esteiras/072, TASK-F121-FE-02. CRUD (list/get/create/update/delete) +
// test-connection + issue-options/contador-options no mesmo arquivo, mirror
// `sharing-service.ts`.
//
// DUAS ADAPTAÇÕES DE ENVELOPE OBRIGATÓRIAS (contrato de tela §3, riscos 1/3):
// (1) `listIntegrationDominios` ADAPTA o envelope PAGINADO REAL
//     (`ApiResponse::paginated()`, `{data:[],meta}`) para o shape
//     `ResponsePagination` que `useCustomGridQuery` consome — mesmo
//     adaptador de `listSharings` (lê `data.meta.*` de verdade). Se
//     retornar o envelope cru, a grid fica vazia e passa em toda estática
//     (`reference_service_lista_deve_adaptar_envelope_paginado`, bug F-128).
// (2) `listIssueOptions`/`listContadorOptions` respondem lista FLAT
//     (`ApiResponse::success([{uuid,label}])`, não paginada) — adaptadas
//     para `{ data: { items } }` (o que `SelectAsyncPaginate` lê via
//     `response.data?.items ?? response.data`).
//
// `farm_id` NUNCA no payload/params — via header `X-Farm-Id` do interceptor
// de `api.V2` (`get_spa_api_client_pattern`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  ConnectionInfo,
  ContadorOption,
  IntegrationDominioData,
  IntegrationDominioListItem,
  IntegrationDominioPayload,
  IntegrationDominiosListEnvelope,
  IssueOption,
  TestConnectionRequest,
} from '@/@types/v2/Integrations/integrationDominio';

const BASE = '/integration-dominios';

export interface ListIntegrationDominiosParams extends PaginationQueryParams {}

async function listIntegrationDominios(
  params: ListIntegrationDominiosParams
): Promise<ResponsePagination<IntegrationDominioListItem[]>> {
  const { data } = await api.V2.get<IntegrationDominiosListEnvelope>(BASE, {
    page: params.page,
    per_page: params.per_page,
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

async function getIntegrationDominio(uuid: string): Promise<Response<IntegrationDominioData>> {
  const { data } = await api.V2.get<Response<IntegrationDominioData>>(`${BASE}/${uuid}`);
  return data;
}

async function createIntegrationDominio(
  payload: IntegrationDominioPayload
): Promise<Response<IntegrationDominioData>> {
  const { data } = await api.V2.post<Response<IntegrationDominioData>>(BASE, payload);
  return data;
}

async function updateIntegrationDominio(
  uuid: string,
  patch: Partial<IntegrationDominioPayload>
): Promise<Response<IntegrationDominioData>> {
  const { data } = await api.V2.put<Response<IntegrationDominioData>>(`${BASE}/${uuid}`, patch);
  return data;
}

async function deleteIntegrationDominio(uuid: string) {
  const { data } = await api.V2.delete(`${BASE}/${uuid}`);
  return data;
}

async function testConnectionIntegrationDominio(
  payload: TestConnectionRequest
): Promise<Response<{ connection: ConnectionInfo }>> {
  const { data } = await api.V2.post<Response<{ connection: ConnectionInfo }>>(
    `${BASE}/test-connection`,
    payload
  );
  return data;
}

export interface IssueOptionsEnvelope {
  success: boolean;
  message: string;
  data: IssueOption[];
  errors: Record<string, string[]> | null;
}

export interface ContadorOptionsEnvelope {
  success: boolean;
  message: string;
  data: ContadorOption[];
  errors: Record<string, string[]> | null;
}

async function listIssueOptions(
  pageParams: PaginationQueryParams
): Promise<ResponsePagination<IssueOption[]>> {
  const { data } = await api.V2.get<IssueOptionsEnvelope>(`${BASE}/issue-options`, pageParams);

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length || 1,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

async function listContadorOptions(
  pageParams: PaginationQueryParams
): Promise<ResponsePagination<ContadorOption[]>> {
  const { data } = await api.V2.get<ContadorOptionsEnvelope>(
    `${BASE}/contador-options`,
    pageParams
  );

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.data.length,
        count: data.data.length,
        per_page: data.data.length || 1,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

export {
  createIntegrationDominio,
  deleteIntegrationDominio,
  getIntegrationDominio,
  listContadorOptions,
  listIntegrationDominios,
  listIssueOptions,
  testConnectionIntegrationDominio,
  updateIntegrationDominio,
};
