// src/pages/Administrativo/Equipes/useEquipes.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de EQUIPES (Team) — mesmo padrão de
// Administrativo/Funcoes/useFunctions.tsx:
//   - useTeamsList → useCustomGridQuery (listagem paginada REAL de servidor +
//     filtros `search`/`is_enabled`, TASK-EQ-FE-01).
//   - useTeamForm → useCustomFormQueryByGuid (hidratação do formulário
//     criar/editar, TASK-EQ-FE-02, contrato de tela §5.7).
//   - useSupervisorOptions/useMemberOptions → satélites de opções (§5.3/§5.4),
//     resposta PLANA sem paginação — `Select` simples + `useQuery` (NUNCA
//     `SelectAsyncPaginate`, armadilha #4 da Tarefa).
//
// Sem Zustand (GAP-EQ-FE-10) — paginação/filtro por `userPaginatedQuery`
// (Contexto React), dados de servidor só no TanStack Query.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getTeam,
  listMemberOptions,
  listSupervisorOptions,
  listTeams,
} from '@/services/v2/Teams/team-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { TeamDetail, TeamFilterForm, TeamListItem } from '@/@types/v2/Teams';

interface UseTeamsListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: TeamFilterForm;
}

// Query de listagem paginada de equipes (filtros `search`/`is_enabled` vão
// como query params — ver `ListTeamsParams`). Ordenação é FIXA
// `description asc`, imposta pelo servidor (`GAP-EQ-FE-06`) — nenhum
// `orderBy` é enviado por esta tela.
export function useTeamsList({ paginatedQuery, setPaginatedQuery, filter }: UseTeamsListProps) {
  return useCustomGridQuery<TeamListItem, TeamFilterForm>({
    asyncFunction: listTeams,
    queryKey: queryKey.workTeams.workTeamsList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as TeamFilterForm),
  });
}

interface UseTeamFormProps {
  registrationId: string | undefined;
  fillForm: (data: TeamDetail, resetForce?: boolean) => void;
}

// Hidratação do formulário criar/editar — `registrationId` inválido/ausente
// (rota "/novo") desabilita a query automaticamente (`isValidGuid` interno do
// hook), sem chamada de rede em modo criação.
export function useTeamForm({ registrationId, fillForm }: UseTeamFormProps) {
  return useCustomFormQueryByGuid<TeamDetail>({
    registrationId,
    asyncFunction: getTeam,
    fillForm,
    queryKey: queryKey.workTeams.workTeam,
  });
}

interface UseSupervisorOptionsProps {
  /** GAP-EQ-FE-04 — em modo visualização (`teams_view` sem `teams_edit`) o
   *  endpoint é gateado por `teams_create|teams_edit` e devolveria 403; a
   *  tela desabilita esta query (`enabled: false`) nesse modo. */
  enabled?: boolean;
}

export function useSupervisorOptions({ enabled = true }: UseSupervisorOptionsProps = {}) {
  return useQuery({
    queryKey: [queryKey.workTeams.supervisorOptions],
    queryFn: listSupervisorOptions,
    enabled,
    retry: false,
  });
}

// Cascata Tipo → Integrante (contrato de tela §5.4) — a queryKey inclui
// `type`, cache COMPARTILHADO entre todas as linhas do repeater que
// escolherem o mesmo tipo (uma requisição por tipo por sessão, nunca uma por
// linha). `type: null` (linha sem Tipo escolhido ainda) desabilita a query.
export function useMemberOptions(type: 2 | 3 | null, enabled = true) {
  return useQuery({
    queryKey: [queryKey.workTeams.memberOptions, type],
    queryFn: () => listMemberOptions(type as 2 | 3),
    enabled: enabled && type !== null,
    retry: false,
  });
}
