// src/@types/v2/Farms/index.d.ts
// -----------------------------------------------------------------------------
// Tipos MÍNIMOS do módulo de FAZENDAS (Farm) — usados só para popular o
// multiselect "Fazendas Vinculadas" de Emissores NFe (TASK-FE-320/322).
//
// ⚠️ RECONFERÊNCIA REAL (disciplina "não presumir" da Tarefa): o
// `IssuerNFe-Frontend-Contrato.md`/TASK-FE-320 assumiam `GET /api/v1/farms`
// (CRUD administrativo, permissão `farms_view`, `FarmDetailResource`). Ao
// reconferir contra o código REAL do fork (`api_root`,
// `app/Http/Controllers/Api/V1/FarmController.php`), esse endpoint exige a
// permissão administrativa `farms_view` — nem todo usuário que cria/edita um
// Emissor tem essa permissão. O fork já tem um endpoint MELHOR ajustado a
// este caso de uso: `GET /api/v1/farms/current-tenant` (Grupo A — SEM
// `permission:`, só `farm.context`/X-Farm-Id, mesmo padrão já usado pelo
// picker de Autorizadores) — devolve `FarmResource::collection` (SEM
// paginação, universo pequeno: fazendas do tenant corrente). Optou-se por
// este endpoint em vez do administrativo — mesma disciplina de "API manda no
// formato do dado" já aplicada a `GAP-FE-113`.
//
// `FarmResource` (api_root): `{ uuid, description, logo, tenant: { use_fiscal,
// list_all_farms } }` — SEM paginação (`ApiResponse::success`, não
// `::paginated`). O `CheckboxListField` já suporta esse contrato ("busca
// sempre CONTROLADA pelo consumidor" — aqui o consumidor filtra client-side,
// já que o endpoint não pagina nem aceita `search`).
// -----------------------------------------------------------------------------

export interface FarmRef {
  uuid: string;
  description: string;
  // Campos reais do `FarmResource` não usados pelo consumidor original
  // (picker de Emissores NFe) — acrescentados de forma ADITIVA/opcional
  // (TASK-FE-920, seletor de fazenda do header) para reaproveitar este
  // mesmo tipo em vez de duplicar um `FarmMineRef` idêntico. Nenhum
  // consumidor existente lê estes campos, então nada quebra.
  logo?: string | null;
  tenant?: {
    use_fiscal: boolean;
    list_all_farms: boolean;
  };
}

export interface FarmsCurrentTenantEnvelope {
  success: boolean;
  message: string;
  data: FarmRef[];
  errors: Record<string, string[]> | null;
  meta: null;
}

export interface UsersQuota {
  limit: number;
  active: number;
  limit_reached: boolean;
}

// GAP-EMP-01/TASK-EMP-FE-07 — payload de GET /me/farms/current. `users_quota`
// é OPCIONAL no tipo de propósito (backend antigo/falha de rede podem não
// trazê-lo) — o consumidor NUNCA deve tratar ausência como bloqueio (ver
// hook `useCurrentFarm`).
export interface FarmCurrent extends FarmRef {
  users_quota?: UsersQuota | null;
}
