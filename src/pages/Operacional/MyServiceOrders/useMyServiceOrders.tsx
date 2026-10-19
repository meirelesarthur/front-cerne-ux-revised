// src/pages/Operacional/MyServiceOrders/useMyServiceOrders.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo Minhas OS (MyServiceOrder) — esteira 063
// (TASK-MOS-FE-04). Mirror `RatingServiceOrders/useRatingServiceOrders.tsx`:
//   - useMyServiceOrdersList → useCustomGridQuery (listagem paginada +
//     filtro, TASK-MOS-FE-04) — SEM `registrationId`/ID de contexto pai
//     (RN-01 já escopa a listagem por `executor_id=auth()` 100% no backend,
//     mirror `useRatingServiceOrdersList`/`useMonitoringList`).
//   - useMyServiceOrderForm → useCustomFormQueryByGuid (hidratação da
//     execução) — usado pelo form da Wave 3 (TASK-MOS-FE-05), `fillForm`
//     REAL injetado pelo caller (`MyServiceOrderExecutionForm.tsx`, ainda não
//     existe nesta wave — este hook só é consumido futuramente).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getAllMyServiceOrders,
  getMyServiceOrder,
} from '@/services/v2/MyServiceOrders/my-service-order-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  MyServiceOrderDetail,
  MyServiceOrderFilterForm,
  MyServiceOrderListItem,
} from '@/@types/v2/MyServiceOrders';

interface UseMyServiceOrdersListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: MyServiceOrderFilterForm;
}

export function useMyServiceOrdersList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseMyServiceOrdersListProps) {
  return useCustomGridQuery<MyServiceOrderListItem, MyServiceOrderFilterForm>({
    asyncFunction: getAllMyServiceOrders,
    queryKey: queryKey.myServiceOrders.myServiceOrders,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as MyServiceOrderFilterForm),
  });
}

interface UseMyServiceOrderFormProps {
  registrationId?: string;
  fillForm: (data: MyServiceOrderDetail, resetForce?: boolean) => void;
}

export function useMyServiceOrderForm({ registrationId, fillForm }: UseMyServiceOrderFormProps) {
  return useCustomFormQueryByGuid<MyServiceOrderDetail>({
    registrationId,
    queryKey: queryKey.myServiceOrders.myServiceOrder,
    asyncFunction: getMyServiceOrder,
    fillForm,
  });
}
