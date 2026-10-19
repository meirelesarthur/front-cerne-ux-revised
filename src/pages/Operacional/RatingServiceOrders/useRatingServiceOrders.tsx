// src/pages/Operacional/RatingServiceOrders/useRatingServiceOrders.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo Avaliações de Ordem de Serviço
// (RatingServiceOrder) — mirror `ServiceOrders/useServiceOrders.tsx`:
//   - useRatingServiceOrdersList → useCustomGridQuery (listagem paginada +
//     filtro, TASK-FE-041-AVL-02) — SEM `registrationId`/ID de contexto pai
//     (mirror `useServiceOrdersList`, escopo `user_id=auth`+`status>=3`
//     100% implícito no backend).
//   - useRatingServiceOrderForm → useCustomFormQueryByGuid (hidratação do
//     form de avaliação, TASK-FE-041-AVL-03) — `fillForm` REAL, injetado
//     pelo caller (`RatingServiceOrderForm.tsx`).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getAllRatingServiceOrders,
  getRatingServiceOrder,
} from '@/services/v2/RatingServiceOrders/rating-service-order-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  RatingServiceOrderDetail,
  RatingServiceOrderFilterForm,
  RatingServiceOrderListItem,
} from '@/@types/v2/RatingServiceOrders';

interface UseRatingServiceOrdersListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: RatingServiceOrderFilterForm;
}

export function useRatingServiceOrdersList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseRatingServiceOrdersListProps) {
  return useCustomGridQuery<RatingServiceOrderListItem, RatingServiceOrderFilterForm>({
    asyncFunction: getAllRatingServiceOrders,
    queryKey: queryKey.ratingServiceOrders.ratingServiceOrders,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as RatingServiceOrderFilterForm),
  });
}

interface UseRatingServiceOrderFormProps {
  registrationId?: string;
  fillForm: (data: RatingServiceOrderDetail, resetForce?: boolean) => void;
}

export function useRatingServiceOrderForm({
  registrationId,
  fillForm,
}: UseRatingServiceOrderFormProps) {
  return useCustomFormQueryByGuid<RatingServiceOrderDetail>({
    registrationId,
    queryKey: queryKey.ratingServiceOrders.ratingServiceOrder,
    asyncFunction: getRatingServiceOrder,
    fillForm,
  });
}
