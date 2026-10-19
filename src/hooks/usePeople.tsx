// src/hooks/usePeople.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo PESSOAS UNIFICADO (Person) — mesmo padrão de
// `pages/CadastrosBase/CondicoesPagamento/usePaymentTerms.tsx`.
//
// `usePersonList` cobre a LISTAGEM (família Grid, paginação real, default 10).
// `usePersonForm` cobre o detalhe/formulário (família Form por UUID).
// `getPersonByNif` (busca por NIF) é exposto DIRETO do service — chamada SOB
// DEMANDA (onBlur do campo NIF), nunca como `useQuery` automático, para não
// disparar uma requisição a cada tecla digitada.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getPersonByUuid, listPeople } from '@/services/v2/People/person-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { PersonDetail, PersonFilterForm, PersonListItem } from '@/@types/v2/People';

interface UsePersonListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: PersonFilterForm;
}

// Query de listagem de Pessoas (filtros `search`/`entity` vão como query
// params reais). Paginação REAL server-side, default 10 (TASK-BE-330).
export function usePersonList({ paginatedQuery, setPaginatedQuery, filter }: UsePersonListProps) {
  return useCustomGridQuery<PersonListItem, PersonFilterForm>({
    asyncFunction: listPeople,
    queryKey: queryKey.people.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as PersonFilterForm),
  });
}

interface UsePersonFormProps {
  registrationId?: string;
  fillForm: (data: PersonDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por UUID).
export function usePersonForm({ registrationId, fillForm }: UsePersonFormProps) {
  return useCustomFormQueryByGuid<PersonDetail>({
    registrationId,
    queryKey: queryKey.people.detail,
    asyncFunction: getPersonByUuid,
    fillForm,
  });
}

// `getPersonByNif` é reexportado direto do service (chamada sob demanda, não
// hook de query) — ver `person-service.ts`. Reexportado aqui só por
// conveniência de import único (`@/hooks/usePeople`) nos Steps do wizard.
export { getPersonByNif } from '@/services/v2/People/person-service';
