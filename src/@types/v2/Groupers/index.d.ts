// src/@types/v2/Groupers/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de AGRUPADORES (Grouper — Cadastros Base / Financeiro).
// Único cadastro-base HIERÁRQUICO (nested-set, `kalnoy/nestedset`) COM
// ESCRITA do projeto — diferente de Racas/TiposTitulo/GruposProduto (flat).
// Catálogo GLOBAL (sem farm_id/tenant_id) — nenhuma chamada deste módulo
// envia `X-Farm-Id` manualmente (mesmo racional de CategoryMatrix/
// TypeTitle/City/State).
//
// Contrato (fonte: 01-Arquitetura_e_Contratos/Grouper/Grouper-contrato.md
// §3/§6/§7, TASK-BE-433 — supersede TASK-BE-050/051/052/053):
//   GET    /api/v1/groupers                 → SEMPRE achatado: uma ÚNICA
//                                              query paginada (per_page
//                                              default 10, teto 100),
//                                              devolvendo a árvore INTEIRA
//                                              (todos os `depth`), ordenada
//                                              hierarquicamente (pai antes
//                                              dos filhos) sem filtro, ou por
//                                              `code` quando há filtro ativo.
//     · `parent_uuid` deixou de ser um MODO — é um filtro `when()` combinável
//       com `search`/`type`/`condition`/`is_enabled` (interseção, não mais
//       modo exclusivo).
//     Envelope sempre `ApiResponse::paginated` (meta REAL).
//   GET    /api/v1/groupers/{uuid}          → data: GrouperDetail
//   POST   /api/v1/groupers                 → payload GrouperPayload
//   PUT    /api/v1/groupers/{uuid}           → payload GrouperPayload — `code`
//                                              NÃO recalcula quando o pai
//                                              muda (fidelidade ao legado,
//                                              D4); `parent_uuid` tem os 3
//                                              estados reais (ver abaixo).
//   DELETE /api/v1/groupers/{uuid}           → 204; física, cascata de
//                                              subárvore em transação no
//                                              backend; 422 se algum
//                                              descendente tiver
//                                              `FinancialCategory` vinculada.
//
// Erros de negócio (422) esperados e NÃO tratados como bug do front — o
// `onError` genérico do `useRequest` já exibe a `message` do envelope:
//   - criar um 5º nível de profundidade (D6);
//   - mover um nó para dentro do próprio descendente (ciclo, D4).
// -----------------------------------------------------------------------------

// ============================================
// GROUPER (resposta da API)
// ============================================

/** Enum GrouperType — 1=Custo, 2=Receita, 3=Depreciação, 4=Financeiro. */
export type GrouperType = 1 | 2 | 3 | 4;

/** Enum GrouperCondition — 1=Categoria, 2=Cálculo. */
export type GrouperCondition = 1 | 2;

export interface GrouperListItem {
  uuid: string;
  /** Código hierárquico gerado server-side (ex.: "1.01") — nunca editável. */
  code: string;
  name: string;
  description: string | null;
  type: GrouperType;
  /** Rótulo pronto do Resource (GrouperType::label()) — não recriar mapeamento no client. */
  type_label: string;
  condition: GrouperCondition;
  /** Rótulo pronto do Resource (GrouperCondition::label()). */
  condition_label: string;
  is_enabled: boolean;
  order: number;
  formula: string | null;
  /** Nível na árvore (nested set `depth`). */
  depth: number;
  parent_uuid: string | null;
  /** Contagem de filhos diretos (`withCount('children')`) — decide a seta de expandir sem carregar a subárvore inteira. */
  children_count: number;
  created_at: string;
  updated_at: string;
}

// GET /groupers/{uuid} devolve o mesmo Resource do index() — sem campos
// extras só-de-detalhe.
export type GrouperDetail = GrouperListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — meta REAL, qualquer um dos 3 modos)
// ============================================

export interface GrouperPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface GroupersListEnvelope {
  success: boolean;
  message: string;
  data: GrouperListItem[];
  errors: Record<string, string[]> | null;
  meta: GrouperPaginationMeta | null;
}

// ============================================
// REQUEST TYPES
// ============================================

// `parent_uuid` com os 3 estados reais do PUT (TASK-BE-051):
//   - chave OMITIDA do payload  → mantém o pai atual;
//   - chave enviada com `null`  → o nó vira RAIZ;
//   - chave enviada com string  → reparenting para o uuid informado.
// Usar `parent_uuid?: string | null` e OMITIR a chave de verdade quando o
// chamador quiser "manter pai atual" (nunca `parent_uuid: undefined`
// explícito — respeitar o comportamento real do `JSON.stringify`/axios, mas
// deixar explícito no chamador — ver ATENÇÃO em `grouper-service.ts`).
export interface GrouperPayload {
  type: GrouperType;
  name: string;
  description?: string | null;
  condition: GrouperCondition;
  is_enabled: boolean;
  order: number;
  formula?: string | null;
  parent_uuid?: string | null;
}

// ============================================
// FILTRO (drawer da listagem — combinável com qualquer um dos 3 modos)
// ============================================

export interface GrouperFilterForm {
  /** Busca por `name`/`code` (param `search` do backend) — aciona o modo BUSCA achatada (contrato §6). */
  search?: string;
  type?: GrouperType | '';
  condition?: GrouperCondition | '';
  is_enabled?: '' | 'true' | 'false';
}

// ============================================
// REACT HOOK FORM (formulário create/edit — TASK-FE-031)
// ============================================

export interface GrouperForm {
  type: GrouperType | undefined;
  name: string;
  description: string;
  condition: GrouperCondition | undefined;
  /** Convenção do projeto (ver ProductGroupForm/CentroCusto): form guarda STRING crua, conversão p/ boolean só no submit. */
  is_enabled: 'true' | 'false' | undefined;
  order: number;
  formula: string;
  /** Pai selecionado na árvore (uuid) ou `null` quando o nó é raiz. */
  parent_uuid: string | null;
}
