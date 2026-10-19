// src/services/v2/Operacional/Monitoring/monitoring-service.ts
// -----------------------------------------------------------------------------
// Monitoring Service — API v1 do backend Laravel GB.Cerne (OPERACIONAL —
// Monitoramento). Casa própria (mirror `ServiceOrders`), NÃO sub-pasta de
// CadastrosBase/BaseRegistrations. TASK-MO-FE-02 (execução 057, service
// layer — SÓ LEITURA, sem CRUD).
//
//   GET /monitoring-service-orders → paginado; listagem de OS do executor
//                                     logado (contrato `MonitoringServiceOrderResource`)
//
// Rota dentro de `farm.context` — X-Farm-Id anexado automaticamente pelo
// interceptor genérico de `@/services/api.ts`.
//
// `getAllMonitoringServiceOrders` ADAPTA o envelope paginado do backend para
// o shape `ResponsePagination` que a infra de grid (`useCustomGridQuery`/
// `TableProvider`) consome — mesmo adaptador de `getAllServiceOrders`
// (`service-order-service.ts`).
//
// NOMES LITERAIS DE QUERYSTRING (mandato de fidelidade, CONTRATO-TELA-F046
// §4 nota de nomeação) — `pagination_quantity` NÃO é renomeado para
// `per_page` nesta chamada, mesmo que o resto do app use `per_page`. `page`
// continua padrão Laravel (paginação nativa).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type {
  MonitoringFilterForm,
  MonitoringServiceOrderListItem,
  MonitoringServiceOrdersListEnvelope,
} from '@/@types/v2/Operacional/Monitoring';

export interface ListMonitoringServiceOrdersParams
  extends PaginationQueryParams, MonitoringFilterForm {}

async function getAllMonitoringServiceOrders(
  params: ListMonitoringServiceOrdersParams
): Promise<ResponsePagination<MonitoringServiceOrderListItem[]>> {
  const { data } = await api.V2.get<MonitoringServiceOrdersListEnvelope>(
    '/monitoring-service-orders',
    {
      page: params.page,
      code: params.code || undefined,
      start_date: params.start_date || undefined,
      end_date: params.end_date || undefined,
      pagination_quantity: params.pagination_quantity || undefined,
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
        per_page: data.meta?.per_page ?? params.pagination_quantity ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

export { getAllMonitoringServiceOrders };
