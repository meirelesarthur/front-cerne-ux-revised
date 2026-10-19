// src/services/v2/Teams/team-service.ts
// -----------------------------------------------------------------------------
// Team Service — API v1 do backend Laravel GB.Cerne (`/teams*`,
// api-contract-equipes.md §4, TASK-EQ-FE-01).
//
// Fundação desta Tarefa: `listTeams`/`deleteTeam`/`exportTeamsReport`. O resto
// (`getTeam`/`createTeam`/`updateTeam`/`listSupervisorOptions`/
// `listMemberOptions`) entra na TASK-EQ-FE-02 (Tela 2 — formulário).
//
// Envelope paginado — a divergência mais perigosa desta camada
// (front-contract-equipes.md §6.1, armadilha #1 da Tarefa): a API devolve
// `{ data: [array plano], meta: { current_page, last_page, per_page, total } }`
// (`ApiResponse::paginated`), MAS o `useCustomGridQuery` espera
// `ResponsePagination<T>` = `{ data: { items, pagination: { total, count,
// per_page, current_page, total_pages } } }`. A adaptação abaixo (`data` →
// `items`, `meta.last_page` → `total_pages`) é responsabilidade DESTE service
// — molde literal `function-service.ts:67-96`.
//
// `X-Farm-Id` anexado automaticamente pelo interceptor genérico de
// `@/services/api.ts` — este service não manipula o header manualmente.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateTeamRequest,
  TeamDetail,
  TeamListItem,
  TeamOption,
  TeamsListEnvelope,
  UpdateTeamRequest,
} from '@/@types/v2/Teams';

// Params aceitos por `GET /teams` — paginação padrão + busca (ILIKE em
// `name`/`description` no servidor) + filtro `is_enabled` (tri-estado).
// Checklist item 4 da Tarefa: `is_enabled` SEMPRE stringificado
// explicitamente antes de ir para a querystring (a querystring HTTP só
// carrega string).
export interface ListTeamsParams extends PaginationQueryParams {
  search?: string;
  is_enabled?: boolean | 'true' | 'false';
}

async function listTeams(params: ListTeamsParams): Promise<ResponsePagination<TeamListItem[]>> {
  const { data } = await api.V2.get<TeamsListEnvelope>('/teams', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    // `??` — NUNCA `||` (armadilha #4 da Tarefa): `is_enabled === false`
    // (filtro "Inativo") é um valor válido e `||` o descartaria
    // silenciosamente, mostrando a lista inteira.
    is_enabled: params.is_enabled !== undefined ? String(params.is_enabled) : undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo padrão de `listFunctions`/`listEmployeeEvents`.
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

// `DELETE /teams/{uuid}` — 204 SEM envelope (armadilha #6 da Tarefa). Não ler
// `data.message` da resposta; a mensagem de sucesso é da tela (i18n).
async function deleteTeam(uuid: string): Promise<void> {
  await api.V2.delete(`/teams/${uuid}`);
}

// `GET /teams/report` — relatório PDF por blob, NUNCA `window.open`
// (armadilha #5 da Tarefa: o endpoint está sob `farm.context` estrito e
// `window.open` não envia `X-Farm-Id`). `responseType` vai no 3º argumento.
async function exportTeamsReport(): Promise<Blob> {
  const { data } = await api.V2.get<Blob>('/teams/report', undefined, {
    responseType: 'blob',
  });
  return data;
}

// -----------------------------------------------------------------------------
// Formulário create/edit (TASK-EQ-FE-02) — mirror exato de
// `function-service.ts::getFunction/createFunction/updateFunction`.
// -----------------------------------------------------------------------------

async function getTeam(uuid: string): Promise<Response<TeamDetail>> {
  const { data } = await api.V2.get<Response<TeamDetail>>(`/teams/${uuid}`);
  return data;
}

async function createTeam(body: CreateTeamRequest): Promise<Response<TeamDetail>> {
  const { data } = await api.V2.post<Response<TeamDetail>>('/teams', body);
  return data;
}

async function updateTeam(uuid: string, body: UpdateTeamRequest): Promise<Response<TeamDetail>> {
  const { data } = await api.V2.put<Response<TeamDetail>>(`/teams/${uuid}`, body);
  return data;
}

// Satélites de opções (§5.3/§5.4 do contrato de tela) — resposta PLANA, SEM
// paginação (`ApiResponse::success` com array de `{uuid, name, nif}`).
// Armadilha #4 da Tarefa: NUNCA `SelectAsyncPaginate` aqui (ele esperaria
// `meta`/`hasMore` que este endpoint não tem) — `Select` simples + `useQuery`
// (mirror `listUserBossOptions`, `user-service.ts`), consumidos pelos hooks
// `useSupervisorOptions`/`useMemberOptions` (`useEquipes.tsx`).
async function listSupervisorOptions(): Promise<TeamOption[]> {
  const { data } = await api.V2.get<Response<TeamOption[]>>('/teams/supervisor-options');
  return data.data ?? [];
}

// `type` restrito a `{2,3}` (armadilha #5) — validado na origem do valor
// (Select fixo de 2 opções em `TeamMemberRow.tsx`), não aqui.
async function listMemberOptions(type: 2 | 3): Promise<TeamOption[]> {
  const { data } = await api.V2.get<Response<TeamOption[]>>('/teams/member-options', { type });
  return data.data ?? [];
}

export {
  createTeam,
  deleteTeam,
  exportTeamsReport,
  getTeam,
  listMemberOptions,
  listSupervisorOptions,
  listTeams,
  updateTeam,
};
