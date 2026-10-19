// src/services/v2/ServiceOrders/service-order-service.ts
// -----------------------------------------------------------------------------
// Service Order Service — API v1 do backend Laravel GB.Cerne (OPERACIONAL —
// Ordens de Serviço). Casa própria (mirror `Appropriations`/`Transfers`), NÃO
// sub-pasta de CadastrosBase/BaseRegistrations. TASK-FE-2001 (execução 038,
// fatia READ) + TASK-FE-2004 (fatia WRITE, D-FRONT-01 RESOLVIDA — FKs `_uuid`).
//
//   GET    /service-orders          → paginado; listagem enxuta
//   POST   /service-orders          → criação (cabeçalho + 5 blocos inline)
//   GET    /service-orders/{uuid}   → detalhe completo
//   PUT    /service-orders/{uuid}   → atualização (recria pivôs integralmente)
//   DELETE /service-orders/{uuid}   → exclusão
//   POST   /service-orders/{uuid}/cancel → cancelamento com motivo (execução
//          086; permissão `service-orders_cancel`, só status 1/2)
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`.
//
// `getAllServiceOrders` ADAPTA o envelope paginado do backend para o shape
// `ResponsePagination` que a infra de grid (`useCustomGridQuery`/
// `TableProvider`) consome — mesmo adaptador de `listAppropriations`/
// `listInvoices`.
//
// TASK-FE-2004 — 4 lookups `/{recurso}/options` EXCLUSIVOS do form de OS
// (Resources enxutos criados na execução 038, decisão do dono 2026-08-20,
// SEM gate de `permission:`, GAP-BE-040 Opção B): `users/options`
// (executor), `operations/options?category=` (cascata IG-02),
// `activities/options?operation_uuid=` (cascata IG-03), `areas/options`.
// `equipments/options` NÃO é repetido aqui — reutiliza
// `listEquipmentCatalogOptions` (`@/services/v2/Equipments/equipment-service`),
// já existente e testado (TASK-FE-840). Demais lookups do form (cultivo/
// lote/categoria animal/funcionário/função/fornecedor/armazém/estoque/
// unidade/produto) reutilizam services já em produção (mirror
// `Appropriations`) — ver imports em `ServiceOrderHeaderFields.tsx`/`tabs/*`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CancelServiceOrderPayload,
  ServiceOrderActivityOption,
  ServiceOrderActivityOptionsListEnvelope,
  ServiceOrderAreaOption,
  ServiceOrderAreaOptionsListEnvelope,
  ServiceOrderDetail,
  ServiceOrderExecutorOption,
  ServiceOrderExecutorOptionsListEnvelope,
  ServiceOrderFilterForm,
  ServiceOrderListItem,
  ServiceOrderOperationOption,
  ServiceOrderOperationOptionsListEnvelope,
  ServiceOrderPayload,
  ServiceOrdersListEnvelope,
} from '@/@types/v2/ServiceOrders';

export interface ListServiceOrdersParams extends PaginationQueryParams, ServiceOrderFilterForm {}

async function getAllServiceOrders(
  params: ListServiceOrdersParams
): Promise<ResponsePagination<ServiceOrderListItem[]>> {
  const { data } = await api.V2.get<ServiceOrdersListEnvelope>('/service-orders', {
    page: params.page,
    per_page: params.per_page,
    code: params.code || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
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

async function getServiceOrder(uuid: string) {
  const { data } = await api.V2.get<Response<ServiceOrderDetail>>(`/service-orders/${uuid}`);
  return data;
}

// `GET /service-orders/next-code` — sugestão de próximo código, SÓ chamada
// em modo CRIAÇÃO (GAP-OS-04, execução 038, decisão do dono confirmando o
// endpoint — supera a `DECISAO_DE_ESCOPO` anterior de `code` como Input
// manual). Resposta simples `{ code: string }`, mirror EXATO
// `getBreedingSeasonNextCode` (`breeding-season-service.ts`).
async function getServiceOrderNextCode(): Promise<Response<{ code: string }>> {
  const { data } = await api.V2.get<Response<{ code: string }>>('/service-orders/next-code');
  return data;
}

async function deleteServiceOrder(uuid: string) {
  const { data } = await api.V2.delete(`/service-orders/${uuid}`);
  return data;
}

// `POST /service-orders/{uuid}/cancel` (execução 086) — status → 9, grava
// motivo/data/usuário no servidor. Devolve o detalhe atualizado. 422 quando a
// OS não está Aberta/Em Execução ou o motivo é inválido (5..1000).
async function cancelServiceOrder(uuid: string, payload: CancelServiceOrderPayload) {
  const { data } = await api.V2.post<Response<ServiceOrderDetail>>(
    `/service-orders/${uuid}/cancel`,
    payload
  );
  return data;
}

// ============================================
// ESCRITA (TASK-FE-2004/2005, D-FRONT-01 RESOLVIDA) — payload 100% uuid.
// `update` é PUT completo (mirror `updateAppropriation`/`updateOperation`) —
// o backend recria os pivôs integralmente (SE-04), então não há PATCH
// parcial por `dirtyFields` aqui (a Tarefa original previa isso antes de
// D-FRONT-01 resolver a semântica real do endpoint).
// ============================================

async function createServiceOrder(payload: ServiceOrderPayload) {
  const { data } = await api.V2.post<Response<ServiceOrderDetail>>('/service-orders', payload);
  return data;
}

async function updateServiceOrder(uuid: string, payload: ServiceOrderPayload) {
  const { data } = await api.V2.put<Response<ServiceOrderDetail>>(
    `/service-orders/${uuid}`,
    payload
  );
  return data;
}

// ============================================
// LOOKUPS EXCLUSIVOS DO FORM DE OS (TASK-FE-2004) — ver nota de topo do
// arquivo. `equipments/options` NÃO está aqui (reusa `equipment-service.ts`).
// ============================================

export interface ListServiceOrderExecutorOptionsParams extends PaginationQueryParams {
  search?: string;
}

// GET /users/options — FLAT (ApiResponse::success, meta sempre null),
// mirror `listWarehouseOptions`/`listEmployees` (adaptador de 1 única
// "página" com o array inteiro).
async function listServiceOrderExecutorOptions(
  params: ListServiceOrderExecutorOptionsParams
): Promise<ResponsePagination<ServiceOrderExecutorOption[]>> {
  const { data } = await api.V2.get<ServiceOrderExecutorOptionsListEnvelope>('/users/options', {
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

export interface ListServiceOrderOperationOptionsParams extends PaginationQueryParams {
  search?: string;
  /** Cascata IG-02 (contrato legado) — `category` (int, mesmo domínio de
   *  `OperationUse`) do cabeçalho da OS. */
  category?: number;
}

// GET /operations/options?category= — PAGINADO (ApiResponse::paginated).
async function listServiceOrderOperationOptions(
  params: ListServiceOrderOperationOptionsParams
): Promise<ResponsePagination<ServiceOrderOperationOption[]>> {
  const { data } = await api.V2.get<ServiceOrderOperationOptionsListEnvelope>(
    '/operations/options',
    {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      category: params.category ?? undefined,
    }
  );

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

export interface ListServiceOrderActivityOptionsParams extends PaginationQueryParams {
  search?: string;
  /** Cascata IG-03 (contrato legado) — `operation_uuid` escolhido no
   *  cabeçalho da OS. */
  operation_uuid?: string;
}

// GET /activities/options?operation_uuid= — PAGINADO (ApiResponse::paginated).
async function listServiceOrderActivityOptions(
  params: ListServiceOrderActivityOptionsParams
): Promise<ResponsePagination<ServiceOrderActivityOption[]>> {
  const { data } = await api.V2.get<ServiceOrderActivityOptionsListEnvelope>(
    '/activities/options',
    {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      operation_uuid: params.operation_uuid || undefined,
    }
  );

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

export interface ListServiceOrderAreaOptionsParams extends PaginationQueryParams {
  search?: string;
}

// GET /areas/options — FLAT (ApiResponse::success, meta sempre null). SEM
// `productive_area` (Resource enxuto) — ver nota em `@/@types/v2/ServiceOrders`
// e `ServiceOrderProductTab.tsx` (GAP residual CV-04/05).
async function listServiceOrderAreaOptions(
  params: ListServiceOrderAreaOptionsParams
): Promise<ResponsePagination<ServiceOrderAreaOption[]>> {
  const { data } = await api.V2.get<ServiceOrderAreaOptionsListEnvelope>('/areas/options', {
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
  cancelServiceOrder,
  createServiceOrder,
  deleteServiceOrder,
  getAllServiceOrders,
  getServiceOrder,
  getServiceOrderNextCode,
  listServiceOrderActivityOptions,
  listServiceOrderAreaOptions,
  listServiceOrderExecutorOptions,
  listServiceOrderOperationOptions,
  updateServiceOrder,
};
