// src/pages/Operacional/ServiceOrders/useServiceOrders.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo Ordens de Serviço (ServiceOrder) — mirror
// `Appropriations/useAppropriations.tsx`:
//   - useServiceOrdersList   → useCustomGridQuery (listagem paginada + filtro,
//     TASK-FE-2002)
//   - useServiceOrderDetail  → useCustomFormQueryByGuid (detalhe para a
//     Visualização, TASK-FE-2003) — SEM `fillForm` real (leitura pura via
//     `query.data`).
//   - useServiceOrderForm    → useCustomFormQueryByGuid (detalhe para o form
//     create/edit, TASK-FE-2005) — `fillForm` REAL, injetado pelo caller
//     (`CreateOrUpdateServiceOrder.tsx`, mirror `useAppropriationForm`).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getAllServiceOrders,
  getServiceOrder,
} from '@/services/v2/ServiceOrders/service-order-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  ServiceOrderDetail,
  ServiceOrderFilterForm,
  ServiceOrderListItem,
} from '@/@types/v2/ServiceOrders';

interface UseServiceOrdersListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: ServiceOrderFilterForm;
}

export function useServiceOrdersList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseServiceOrdersListProps) {
  return useCustomGridQuery<ServiceOrderListItem, ServiceOrderFilterForm>({
    asyncFunction: getAllServiceOrders,
    queryKey: queryKey.serviceOrders.serviceOrders,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as ServiceOrderFilterForm),
  });
}

interface UseServiceOrderDetailProps {
  registrationId?: string;
}

export function useServiceOrderDetail({ registrationId }: UseServiceOrderDetailProps) {
  return useCustomFormQueryByGuid<ServiceOrderDetail>({
    registrationId,
    queryKey: queryKey.serviceOrders.serviceOrder,
    asyncFunction: getServiceOrder,
    // Leitura pura — a Visualização (TASK-FE-2003) não tem `useForm`, lê
    // direto de `query.data`. Sem escrita, `fillForm` é um no-op (mirror
    // `AppropriationDetalhe.tsx`).
    fillForm: () => undefined,
  });
}

interface UseServiceOrderFormProps {
  registrationId?: string;
  fillForm: (data: ServiceOrderDetail, resetForce?: boolean) => void;
}

// TASK-FE-2005 — variante COM `fillForm` real, para o form create/edit
// (`CreateOrUpdateServiceOrder.tsx`), mirror `useAppropriationForm`. Casa
// própria de `useServiceOrderDetail` acima (aquela é exclusiva da
// Visualização read-only) — mesma `queryKey`/`asyncFunction`, só o `fillForm`
// muda de no-op para real.
export function useServiceOrderForm({ registrationId, fillForm }: UseServiceOrderFormProps) {
  return useCustomFormQueryByGuid<ServiceOrderDetail>({
    registrationId,
    queryKey: queryKey.serviceOrders.serviceOrder,
    asyncFunction: getServiceOrder,
    fillForm,
  });
}
