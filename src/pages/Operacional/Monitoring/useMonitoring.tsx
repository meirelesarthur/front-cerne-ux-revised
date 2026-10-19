// src/pages/Operacional/Monitoring/useMonitoring.tsx
// -----------------------------------------------------------------------------
// Hook de query da tela ÚNICA de Monitoramento (MonitoringServiceOrder) —
// TASK-MO-FE-03 (esteira `97-Esteiras/057`). Mirror `useServiceOrdersList`
// (`ServiceOrders/useServiceOrders.tsx`) — listagem GLOBAL, SEM ID de
// contexto pai (contrato de tela §7: tenant vai no header `X-Farm-Id`,
// automático pelo interceptor, não como parâmetro de rota).
//
// Feature 100% leitura — não há `useServiceOrderForm`/`useServiceOrderDetail`
// equivalentes aqui (sem CRUD, ver Objetivo da Tarefa).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getAllMonitoringServiceOrders } from '@/services/v2/Operacional/Monitoring/monitoring-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  MonitoringFilterForm,
  MonitoringServiceOrderListItem,
} from '@/@types/v2/Operacional/Monitoring';

interface UseMonitoringListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: MonitoringFilterForm;
}

export function useMonitoringList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseMonitoringListProps) {
  return useCustomGridQuery<MonitoringServiceOrderListItem, MonitoringFilterForm>({
    asyncFunction: getAllMonitoringServiceOrders,
    queryKey: queryKey.monitoring.monitorings,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as MonitoringFilterForm),
  });
}
