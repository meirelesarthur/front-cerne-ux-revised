// src/pages/CadastrosBase/Afiliados/useAfiliados.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de AFILIADOS (Partner) — mesmo padrão de
// `Produtos/Classes/useKinds.tsx`:
//   - usePartnersList → useCustomGridQuery (listagem, SEM ID de contexto —
//     catálogo GLOBAL, sem farm/tenant)
//   - usePartnerForm  → useCustomFormQueryByGuid (detalhe p/ formulário, Lei 2)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getPartnerByUuid, listPartners } from '@/services/v2/Afiliados/partner-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { PartnerDetail, PartnerFilterForm, PartnerListItem } from '@/@types/v2/Afiliados';

// Shape efetivamente enviado a `/partners` (server-side).
export interface PartnerListRequestFilter {
  search?: string;
  status?: 1 | 2 | 3;
}

interface UsePartnersListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: PartnerFilterForm;
}

// Query de listagem de Afiliados (SEM ID de contexto — `useCustomGridQuery`,
// mirror `useKindsList`).
export function usePartnersList({ paginatedQuery, setPaginatedQuery, filter }: UsePartnersListProps) {
  const requestFilter: PartnerListRequestFilter = {
    search: filter?.search,
    status: filter?.status,
  };

  return useCustomGridQuery<PartnerListItem, PartnerListRequestFilter>({
    asyncFunction: listPartners,
    queryKey: queryKey.afiliados.partners,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });
}

interface UsePartnerFormProps {
  registrationId?: string;
  fillForm: (data: PartnerDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID).
export function usePartnerForm({ registrationId, fillForm }: UsePartnerFormProps) {
  return useCustomFormQueryByGuid<PartnerDetail>({
    registrationId,
    queryKey: queryKey.afiliados.partner,
    asyncFunction: getPartnerByUuid,
    fillForm,
  });
}
