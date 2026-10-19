// src/@types/v2/Teams/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de EQUIPES (Team — equipe de fazenda, Administrativo /
// Gestão Pessoal). NÃO reutilizar `src/@types/v2/Admin/teams` (SaaS/billing,
// `TeamData`/`TeamMemberData` — `owner_id`/`max_members`/`stripe_customer_id`/
// `tier`, outro domínio, GAP-EQ-FE-01).
//
// Fonte: `api-contract-equipes.md` §4.2 (payload) e §4.8 (Resources) —
// `TeamResource`/`TeamMemberResource`/`TeamOptionResource`. `uuid` sempre,
// `id`/`farm_id`/`employee_id`/`provider_id` NUNCA aparecem no envelope.
//
// TASK-EQ-FE-01 cobre a fundação (tipos completos, listagem consome
// `TeamListItem`/`TeamFilterForm`/`TeamsListEnvelope`). `TeamMember`/
// `TeamOption`/`CreateTeamRequest` já são declarados aqui (fundação completa,
// por instrução da Tarefa) mas só são CONSUMIDOS pelo service/formulário na
// TASK-EQ-FE-02.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENTIDADES ANINHADAS
// ============================================

export interface TeamSupervisor {
  uuid: string;
  name: string;
  nif: string;
}

export interface TeamMemberProvider {
  uuid: string;
  name: string;
  nif: string;
}

// `TeamMemberResource` — item hidratado de `members[]` no `GET /teams/{uuid}`
// (contrato de API §4.8). `type_label` vem de `ProviderTypeEnum::label()`.
export interface TeamMember {
  uuid: string;
  type: 2 | 3;
  type_label: string;
  is_enabled: boolean;
  provider: TeamMemberProvider;
}

// ============================================
// RECURSO PRINCIPAL — `TeamResource` (mesmo shape em index/show/store/update)
// ============================================

export interface TeamListItem {
  uuid: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  /** `whenLoaded` no backend — pode vir `null`. Renderizar traço, nunca
   *  `undefined` na célula (armadilha #7 da Tarefa). */
  supervisor: TeamSupervisor | null;
  members: TeamMember[];
  created_at: string;
  updated_at: string;
}

// `TeamResource` devolve o mesmo shape em `show`/`store`/`update` que em
// `index` (contrato de API §4.8) — `TeamDetail` é um alias estrutural de
// `TeamListItem`, mantido como tipo próprio por clareza semântica no
// formulário (Tarefa irmã TASK-EQ-FE-02).
export type TeamDetail = TeamListItem;

// ============================================
// OPÇÕES (satélites — `supervisor-options`/`member-options`, TASK-EQ-FE-02)
// ============================================

// `TeamOptionResource` — resposta plana, SEM paginação (`ApiResponse::success`
// com array de `{uuid, name, nif}`). Rótulo de exibição: `"{name} - {nif}"`,
// com o `- {nif}` omitido quando `nif` for vazio (contrato de tela §5.3/§5.4).
export interface TeamOption {
  uuid: string;
  name: string;
  nif: string;
}

// ============================================
// FILTRO (drawer da listagem, TASK-EQ-FE-01)
// ============================================

export interface TeamFilterForm {
  /** Busca ILIKE em `name`/`description` no servidor. */
  search?: string;
  is_enabled?: 'true' | 'false';
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface TeamsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface TeamsListEnvelope {
  success: boolean;
  message: string;
  data: TeamListItem[];
  errors: Record<string, string[]> | null;
  meta: TeamsApiPaginationMeta | null;
}

// ============================================
// FORMULÁRIO create/edit (TASK-EQ-FE-02) — declarado aqui por instrução da
// fundação (TASK-EQ-FE-01), consumido só na Tarefa irmã.
// ============================================

// Payload por linha do repeater de integrantes (contrato de API §4.2).
export interface CreateTeamMemberRequest {
  provider_uuid: string;
  type: 2 | 3;
  is_enabled: boolean;
}

// Payload real enviado à API — full-resource-replace (`TeamRequest` unificado
// store+update exige todos os campos em ambos, contrato de tela §5.5).
// `members` OMITIDO (nunca `[]`) quando não há integrante — `GAP-EQ-FE-03`,
// a regra do servidor é `nullable|array|min:1`.
export interface CreateTeamRequest {
  name: string;
  description?: string;
  employee_uuid: string;
  is_enabled: boolean;
  members?: CreateTeamMemberRequest[];
}

// Mesmo shape do create — full-resource-replace (contrato de tela §5.5).
export type UpdateTeamRequest = CreateTeamRequest;

// ============================================
// FORMULÁRIO RHF (TASK-EQ-FE-02) — shape INTERNO do react-hook-form. Os
// selects (Encarregado/Tipo/Integrante) trabalham com `Option<T>` inteiro
// (label+value); o submit (`tryPersistTeam`, `CreateOrUpdateEquipe.tsx`)
// converte para `CreateTeamRequest`/`UpdateTeamRequest` (uuid/type crus).
// ============================================

// Linha do repeater de integrantes — `provider_uuid`/`type` começam `null`
// (linha nova) e só viram objeto `Option` após a escolha do usuário
// (armadilha #3: trocar `type` limpa `provider_uuid`; armadilha #17:
// "Adicionar" fica bloqueado enquanto alguma linha estiver incompleta).
export interface TeamMemberForm {
  provider_uuid: Option<string> | null;
  type: Option<2 | 3> | null;
  is_enabled: boolean;
}

export interface TeamForm {
  name: string;
  description: string;
  employee_uuid: Option<string> | null;
  is_enabled: boolean;
  members: TeamMemberForm[];
}
