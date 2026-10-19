import type { TrialInfo } from '@/@types/v2/Billing';

// ============================================
// TIPOS DE PERMISSÕES - API V2 (GB Cerne)
// ============================================
// Estrutura baseada no endpoint /api/v2/auth/me
// Tier → Permissions (endpoints) + Teams → Roles → Permissions

/**
 * Permissão de endpoint individual
 * Representa acesso a uma rota específica da API
 */
export interface EndpointPermission {
  id: number;
  name: string;      // Ex: "/api/v2/admin/agents"
  method: string;    // Ex: "GET", "POST", "PUT", "DELETE", "PATCH"
  tag: string;       // Ex: "admin", "auth", "teams", "chats", "agents", "models"
}

/**
 * Tier do usuário com suas permissões e limites
 * Define o nível de acesso global e limites de uso do usuário
 * Campos expandidos conforme resposta do GET /auth/me (atualizado 26/02/2026)
 */
export interface UserTier {
  id: number;
  name: string;
  price_monthly: number;
  monthly_usage_budget_usd: number;
  max_pentests_per_month: number | null;
  max_teams: number | null;
  max_api_tokens: number | null;
  max_agents: number | null;
  max_scheduled_pentests: number | null;
  is_custom_pricing: boolean;
  permissions: EndpointPermission[];
}

/**
 * Role dentro de um Team
 * Define permissões específicas dentro de uma equipe
 */
export interface TeamRole {
  id: number;
  role_name: string;
  color: string;
  permissions: EndpointPermission[];
}

/**
 * Status de billing/pagamento de uma equipe
 * Retornado no GET /auth/me → teams[].billing_status
 */
export type TeamBillingStatus =
  | 'payment_pending'
  | 'active'
  | 'grace_period'
  | 'past_due'
  | 'suspended';

/**
 * Team do usuário com seus roles
 */
export interface UserTeam {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  is_owner: boolean;
  status: number;
  max_members: number;
  created_at: string;
  updated_at: string;
  roles: TeamRole[];
  billing_status: TeamBillingStatus;
}

/**
 * Dados da assinatura Stripe do usuário
 * Retornado pelo GET /auth/me
 * null quando o usuário está no plano Casual (sem assinatura)
 */
export interface SubscriptionData {
  status: string;
  billing_interval: 'month' | 'year';
  current_period_end: string;
  cancel_at_period_end: boolean;
}

/**
 * Resposta completa do usuário da API /auth/me
 * Estrutura atualizada com tier, subscription e teams
 */
export interface UserProfileV2 {
  user_id: number;
  username: string;
  email: string;
  verified: boolean;
  external_user: boolean;
  login_count: number;
  queue_prio: number;
  deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  country: string;
  region: string;
  language: string;
  tier: UserTier;
  trial: TrialInfo | null;
  subscription: SubscriptionData | null;
  teams: UserTeam[];
  assigned_models: Array<{ model_name: string; model_alias: string }>;
  assigned_agents: string[];
  assigned_agents_count: number;
  /**
   * Subconjunto farm-scoped de `permissions` (GAP-BE-033) — nomes de
   * permissão (ex.: "warehouses_view") que exigem fazenda ativa
   * (`is_farm=true` em algum ancestral de `App\Support\PermissionTree` no
   * backend). Sempre um array (nunca null) quando presente. Optional porque
   * este tipo já diverge do contrato real do GB Cerne — não declara
   * `permissions`/`roles`/`favorites`/`uuid`/`name`, herdados de outro
   * template SaaS (ver src/contexts/AuthContext/index.tsx). Consumido via
   * `usePermissions().isFarmScoped()`.
   */
  farm_scoped_permissions?: string[];
  /**
   * TASK-072-FE-11 (API-01, T01-j) — sinal de contexto do `GET /auth/me`:
   * distingue o contratante sem fazenda do Gestor_Plataf/funcionário (que
   * também recebem `farms[]` vazio). Optional: back antigo não envia →
   * guard em fail-open (não redireciona).
   */
  farm_context?: FarmContextSignal;
}

/** `GET /auth/me` → `farm_context` (`GetFarmContextSignalAction`, API-01). */
export interface FarmContextSignal {
  /** Titular de tenant ATIVO. Gestor_Plataf é sempre `false`. */
  is_contractor: boolean;
  /** Existe fazenda ativa do usuário (mesmo universo de `GET /me/farms`). */
  has_farms: boolean;
}

/**
 * Resposta da API /auth/me
 */
export interface AuthMeResponse {
  success: boolean;
  data: UserProfileV2;
}

// ============================================
// TIPOS AUXILIARES PARA VERIFICAÇÃO
// ============================================

/**
 * Módulos do sistema (baseados nas tags da API)
 */
export type ApiTag = 
  | 'admin'      // Rotas administrativas
  | 'auth'       // Autenticação e perfil
  | 'teams'      // Gerenciamento de equipes
  | 'chats'      // Chat e conversas
  | 'agents'     // Agentes de IA
  | 'models'     // Modelos de IA
  | 'phases'     // Fases de pentest
  | 'invitations'// Convites
  | 'llm';       // Backend de IA/LLM

/**
 * Métodos HTTP
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Check de permissão simplificado
 */
export interface PermissionCheck {
  endpoint: string;
  method: HttpMethod;
}

/**
 * Resultado da verificação de permissão
 */
export interface PermissionCheckResult {
  allowed: boolean;
  source: 'tier' | 'team' | 'none';
  teamId?: number;
  reason?: string;
}

// ============================================
// MAPEAMENTO DE MÓDULOS PARA TAGS
// ============================================

/**
 * Mapeamento de rotas do frontend para tags da API
 */
export interface ModuleTagMapping {
  moduleId: string;          // ID do módulo no frontend (ex: 'admin', 'pentest-manager')
  requiredTags: ApiTag[];    // Tags da API necessárias para acessar
  description: string;       // Descrição do módulo
}

/**
 * Ações padronizadas por recurso
 */
export type ResourceAction = 
  | 'list'     // GET /resource
  | 'view'     // GET /resource/:id
  | 'create'   // POST /resource
  | 'update'   // PUT/PATCH /resource/:id
  | 'delete'   // DELETE /resource/:id
  | 'enable'   // PATCH /resource/:id/enable
  | 'disable'  // PATCH /resource/:id/disable
  | 'restore'; // POST /resource/:id/restore

/**
 * Recurso com suas ações mapeadas
 */
export interface ResourcePermissionMap {
  resource: string;
  tag: ApiTag;
  actions: {
    [key in ResourceAction]?: {
      endpoint: string;
      method: HttpMethod;
    };
  };
}
