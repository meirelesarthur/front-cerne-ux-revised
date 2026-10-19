// src/@types/v2/BaseRegistrations/systemUpdate/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo ATUALIZAÇÕES DO SISTEMA (SystemUpdate) — API v1 do backend
// Laravel GB.Cerne, execução 031, TASK-FE-1100. Cadastro administrativo
// GLOBAL (comunicados/changelog), sem `farm_id`/tenancy — mesma exceção de
// `Bank`/`Warehouse` (contrato-front-atualizacoes-sistema.md §1, contrato de
// API §5).
//
// Fonte: contrato de API AUTOAPROVADO desta execução (§2/§4/§6) + leitura
// direta de `SystemUpdateResource.php` (api_root) — o Resource real expõe
// SOMENTE `uuid`/`release_date`/`description` (SEM `created_at`/
// `updated_at`, diferente do que o contrato de tela havia presumido
// literalmente). `created_at`/`updated_at` ficam tipados como OPCIONAIS
// abaixo por segurança de tipo (nenhuma tela desta execução lê esses 2
// campos — Listagem/Visualização usam só `release_date`/`description`), não
// removidos por documentar fielmente o shape real observado.
//
// `show === index` no shape (alias estrutural, sem agregação extra) — mesmo
// padrão de `WarehouseDetail`.
// -----------------------------------------------------------------------------

// ============================================
// SYSTEM UPDATE (resposta da API)
// ============================================

export interface SystemUpdateListItem {
  uuid: string;
  /** ISO 'yyyy-MM-dd' (`SystemUpdateResource::release_date`, sem hora). */
  release_date: string;
  /** HTML cru — NUNCA renderizar sem `sanitizeHtml()` (GAP-BE-512, §7.2). */
  description: string;
  /** Não expostos pelo `SystemUpdateResource` real hoje — ver nota acima. */
  created_at?: string | null;
  updated_at?: string | null;
}

// show === index no shape — alias estrutural, NÃO supertipo com campos extras.
export type SystemUpdateDetail = SystemUpdateListItem;

// ============================================
// REQUEST TYPES
// ============================================

export interface SystemUpdatePayload {
  /** 'yyyy-MM-dd' */
  release_date: string;
  /** HTML rico produzido pelo `RichTextEditor` (Tiptap, §7.1). */
  description: string;
}

// ============================================
// REACT HOOK FORM (TASK-FE-1102 — campos do formulário)
// ============================================

export interface SystemUpdateForm {
  uuid?: string;
  release_date: string;
  description: string;
}

// Sem SystemUpdateFilterForm — esta tela não tem filtro (contrato de tela
// §1.1: o legado nunca teve busca/filtro em `SystemUpdate`).

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface SystemUpdatesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
  };
}

export interface SystemUpdatesListEnvelope {
  success: boolean;
  message: string;
  data: SystemUpdateListItem[];
  errors: Record<string, string[]> | null;
  meta: SystemUpdatesApiPaginationMeta | null;
}

// ============================================
// POPUP DO DASHBOARD (GAP-BE-511, decisão do dono: Opção A) —
// `GET /system-updates/pending` + `POST /system-updates/{uuid}/seen`.
// Leitura direta de `SystemUpdateController::pending()/markSeen()` (api_root):
// `pending` devolve coleção FLAT (`ApiResponse::success`, SEM paginação —
// mesmo formato de `LowReasonController::active()`); `markSeen` devolve
// `data: null`. Fonte de verdade real > pseudo-shape do gatilho.
// ============================================

export interface SystemUpdatePendingEnvelope {
  success: boolean;
  message: string;
  data: SystemUpdateListItem[];
  errors: Record<string, string[]> | null;
  meta: null;
}
