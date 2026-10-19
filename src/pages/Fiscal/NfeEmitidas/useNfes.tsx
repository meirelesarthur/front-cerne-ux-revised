// src/pages/Fiscal/NfeEmitidas/useNfes.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de NFe Emitidas (domínio Fiscal) — mirror
// `Invoices/useInvoices.tsx`:
//   - useNfesList → useCustomGridQuery (listagem paginada + filtros,
//     TASK-FE-036-403)
//   - useNfeForm  → useCustomFormQueryByGuid (detalhe p/ formulário,
//     TASK-FE-036-404)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getNfe, listNfes } from '@/services/v2/Fiscal/nfe-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { NfeDetail, NfeFilterForm, NfeListItem } from '@/@types/v2/Nfes';

interface UseNfesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: NfeFilterForm;
}

export function useNfesList({ paginatedQuery, setPaginatedQuery, filter }: UseNfesListProps) {
  return useCustomGridQuery<NfeListItem, NfeFilterForm>({
    asyncFunction: listNfes,
    queryKey: queryKey.nfes.nfesList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as NfeFilterForm),
  });
}

interface UseNfeFormProps {
  registrationId?: string;
  fillForm: (data: NfeDetail, resetForce?: boolean) => void;
}

export function useNfeForm({ registrationId, fillForm }: UseNfeFormProps) {
  return useCustomFormQueryByGuid<NfeDetail>({
    registrationId,
    queryKey: queryKey.nfes.nfe,
    asyncFunction: getNfe,
    fillForm,
  });
}
