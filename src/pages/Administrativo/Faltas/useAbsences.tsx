// src/pages/Administrativo/Faltas/useAbsences.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de REGISTRO DE FALTAS (Absence) — mesmo padrão de
// Administrativo/Eventos/useEventos.tsx:
//   - useAbsencesList → useCustomGridQuery (listagem paginada REAL de
//     servidor + filtros employee_uuid/event_uuid/start_date/end_date,
//     Tarefa 12)
//   - useAbsenceForm  → useCustomFormQueryByGuid (detalhe p/ formulário,
//     Tarefa 13) — mesmo hook usado por `useEventoForm` (o molde estrutural
//     desta feature, `Eventos`).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getAbsence, listAbsences } from '@/services/v2/Absences/absence-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { AbsenceDetail, AbsenceFilterForm, AbsenceListItem } from '@/@types/v2/Absences';

interface UseAbsencesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: AbsenceFilterForm;
}

// Query de listagem paginada de faltas (filtros employee_uuid/event_uuid/
// start_date/end_date vão como query params — ver ListAbsencesParams).
// Paginação REAL de servidor — mesmo shape de `useEventosList`.
export function useAbsencesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseAbsencesListProps) {
  return useCustomGridQuery<AbsenceListItem, AbsenceFilterForm>({
    asyncFunction: listAbsences,
    queryKey: queryKey.absences.absencesList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as AbsenceFilterForm),
  });
}

interface UseAbsenceFormProps {
  registrationId?: string;
  fillForm: (data: AbsenceDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID) —
// Tarefa 13. Mesmo padrão de `useEventoForm` (Eventos, o molde estrutural
// desta feature).
export function useAbsenceForm({ registrationId, fillForm }: UseAbsenceFormProps) {
  return useCustomFormQueryByGuid<AbsenceDetail>({
    registrationId,
    queryKey: queryKey.absences.absence,
    asyncFunction: getAbsence,
    fillForm,
  });
}
