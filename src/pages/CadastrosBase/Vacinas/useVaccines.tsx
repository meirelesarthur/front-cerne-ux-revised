// src/pages/CadastrosBase/Vacinas/useVaccines.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de VACINAS — mesmo padrão de Racas/useBreeds.tsx:
//   - useVaccineList → useCustomGridQuery (listagem, SEM ID de contexto)
//   - useVaccineForm → useCustomFormQueryByGuid (detalhe p/ formulário)
//
// `VaccineFilterForm.specie_uuid` é filtro SERVER-SIDE — o `filter` repassado
// ao `useCustomGridQuery` aqui inclui `specie_uuid` junto com `search`/
// `is_enabled`, indo direto na querystring real de `GET /vaccines`.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getVaccineByUuid, listVaccines } from '@/services/v2/Vaccines/vaccine-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { VaccineData, VaccineFilterForm, VaccineListItem } from '@/@types/v2/Vaccines';

export interface VaccineListRequestFilter {
  search?: string;
  is_enabled?: '' | 'true' | 'false';
  specie_uuid?: string;
}

interface UseVaccineListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: VaccineFilterForm;
}

export function useVaccineList({ paginatedQuery, setPaginatedQuery, filter }: UseVaccineListProps) {
  const requestFilter: VaccineListRequestFilter = {
    search: filter?.search,
    is_enabled: filter?.is_enabled,
    specie_uuid: filter?.specie_uuid,
  };

  return useCustomGridQuery<VaccineListItem, VaccineListRequestFilter>({
    asyncFunction: listVaccines,
    queryKey: queryKey.vaccines.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: requestFilter,
  });
}

interface UseVaccineFormProps {
  registrationId?: string;
  fillForm: (data: VaccineData, resetForce?: boolean) => void;
}

export function useVaccineForm({ registrationId, fillForm }: UseVaccineFormProps) {
  return useCustomFormQueryByGuid<VaccineData>({
    registrationId,
    queryKey: queryKey.vaccines.detail,
    asyncFunction: getVaccineByUuid,
    fillForm,
  });
}
