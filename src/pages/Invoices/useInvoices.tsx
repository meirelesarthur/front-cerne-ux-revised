// src/pages/Invoices/useInvoices.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de Invoice (Doc. Fiscal/Entrada) — mesmo padrão de
// `Planos/usePlanRole.tsx`:
//   - useInvoicesList → useCustomGridQuery (listagem paginada + filtros,
//     TASK-FE-2762)
//   - useInvoiceForm  → useCustomFormQueryByGuid (detalhe p/ formulário,
//     TASK-FE-2763)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getInvoice, listInvoices } from '@/services/v2/Invoices/invoice-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { InvoiceDetail, InvoiceFilterForm, InvoiceListItem } from '@/@types/v2/Invoices';

interface UseInvoicesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: InvoiceFilterForm;
}

export function useInvoicesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseInvoicesListProps) {
  return useCustomGridQuery<InvoiceListItem, InvoiceFilterForm>({
    asyncFunction: listInvoices,
    queryKey: queryKey.invoices.invoices,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as InvoiceFilterForm),
  });
}

interface UseInvoiceFormProps {
  registrationId?: string;
  fillForm: (data: InvoiceDetail, resetForce?: boolean) => void;
}

export function useInvoiceForm({ registrationId, fillForm }: UseInvoiceFormProps) {
  return useCustomFormQueryByGuid<InvoiceDetail>({
    registrationId,
    queryKey: queryKey.invoices.invoice,
    asyncFunction: getInvoice,
    fillForm,
  });
}
