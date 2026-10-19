// src/pages/Administrativo/Eventos/useEventos.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de EVENTOS (Event) — mesmo padrão de
// Administrativo/Funcoes/useFunctions.tsx:
//   - useEventosList → useCustomGridQuery (listagem paginada REAL de servidor
//     + filtros `search`/`is_enabled`/`start_date`/`end_date`, TASK-FE-EVT-01)
//   - useEventoForm  → useCustomFormQueryByGuid (detalhe p/ formulário,
//     TASK-FE-EVT-02) — mesmo hook usado por `useFunctionForm` (o molde
//     estrutural desta feature, `Funcoes`).
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getEvent, listEvents } from '@/services/v2/Events/event-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { EventDetail, EventFilterForm, EventListItem } from '@/@types/v2/Events';

interface UseEventosListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: EventFilterForm;
}

// Query de listagem paginada de eventos (filtros `search`/`is_enabled`/
// `start_date`/`end_date` vão como query params — ver ListEventsParams).
// Paginação REAL de servidor — mesmo shape de `useFunctionsList`.
export function useEventosList({ paginatedQuery, setPaginatedQuery, filter }: UseEventosListProps) {
  return useCustomGridQuery<EventListItem, EventFilterForm>({
    asyncFunction: listEvents,
    queryKey: queryKey.events.eventsList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as EventFilterForm),
  });
}

interface UseEventoFormProps {
  registrationId?: string;
  fillForm: (data: EventDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (match por GUID) —
// TASK-FE-EVT-02. Mesmo padrão de `useFunctionForm` (Funcoes, o molde
// estrutural desta feature).
export function useEventoForm({ registrationId, fillForm }: UseEventoFormProps) {
  return useCustomFormQueryByGuid<EventDetail>({
    registrationId,
    queryKey: queryKey.events.event,
    asyncFunction: getEvent,
    fillForm,
  });
}
