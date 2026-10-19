// src/@types/v2/BaseRegistrations/typeTitles/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de TIPOS DE TÍTULO (TypeTitle) — API v1 do backend Laravel
// GB.Cerne. Criado em TASK-TT-01 (listagem paginada real + filtros),
// completado em TASK-TT-02 (formulário create/edit).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }),
// confirmado por leitura direta de TypeTitleController/Resource/Request/
// FilterData/Enums (api_root), pós-TASK-TT-API-01:
//   GET    /type-titles            → data: TypeTitleListItem[] + meta REAL de
//                                     paginação (ApiResponse::paginated(),
//                                     current_page/last_page/per_page/total —
//                                     TypeTitle agora PAGINA DE VERDADE, não é
//                                     mais o truque `meta:null` de Species).
//   GET    /type-titles/{uuid}     → data: TypeTitleDetail (mesmo shape flat).
//   POST   /type-titles            → payload TypeTitlePayload (create).
//   PUT    /type-titles/{uuid}     → payload TypeTitlePayload — SEMPRE os 4
//                                     campos (description/type/factor/
//                                     is_enabled), nunca delta
//                                     (TypeTitleRequest::rules() não distingue
//                                     verbo — full-resource-replace).
//   DELETE /type-titles/{uuid}     → 204; 422 estruturado (BusinessRuleException)
//                                     se em uso em expenses/incomes/transfers —
//                                     mensagem real "Tipo de título está em uso
//                                     e não pode ser excluído."
//
// `type`/`factor` são ENUMS INT no backend (TypeTitleType/TypeTitleFactor,
// Rule::in nos 2), nunca string/label. `type_label`/`factor_label` vêm
// PRONTOS do TypeTitleResource (Enums::description()) — não recriar o
// mapeamento Pagar/Receber/Ambas ou Soma/Diminui no client.
//
// `code`: nullable, exposto pelo Resource mas NÃO usado por nenhuma das 2
// Tarefas (nem lido no formulário) — fiel ao legado, que também não o expõe
// no form apesar de `fillable`.
//
// `TypeTitle` é catálogo GLOBAL (sem farm_id/tenant_id) — nenhum serviço deste
// módulo depende de X-Farm-Id (o interceptor axios global ainda anexa o
// header automaticamente quando há fazenda ativa, mas o backend o ignora
// para este recurso; mesmo racional de CategoryMatrix/LowReason).
// -----------------------------------------------------------------------------

// ============================================
// TYPE TITLE (resposta da API)
// ============================================

export interface TypeTitleListItem {
  uuid: string;
  description: string;
  /** Enum TypeTitleType — 1=Pagar, 2=Receber, 3=Ambas. */
  type: 1 | 2 | 3;
  /** Rótulo pronto do Resource (TypeTitleType::description()) — "Pagar" | "Receber" | "Ambas". */
  type_label: string;
  /** Enum TypeTitleFactor — 1=Soma, 2=Diminui. */
  factor: 1 | 2;
  /** Rótulo pronto do Resource (TypeTitleFactor::description()) — "Soma" | "Diminui". */
  factor_label: string;
  is_enabled: boolean;
  /** Nullable, exposto pelo Resource — NÃO usado pela UI (TASK-TT-01/02). */
  code: string | null;
}

// TASK-TT-02: mesmo shape flat do `TypeTitleListItem` — GET /type-titles/{uuid}
// devolve o mesmo Resource do index(), sem campos extras só-de-detalhe.
export type TypeTitleDetail = TypeTitleListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — REAL, pós-TASK-TT-API-01)
// ============================================

export interface TypeTitlesListEnvelope {
  success: boolean;
  message: string;
  data: TypeTitleListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

// ============================================
// OPTIONS (GET /type-titles/options — GAP-BE-040 addendum, 9ª instância,
// TASK-BE-620/TASK-FE-623) — lookup ENXUTO, SEM gate de `typetitles_view`
// (só `auth:sanctum`). `TypeTitleOptionResource` devolve
// `uuid`+`description`+`type`+`type_label`+`factor`+`factor_label` — SEM
// `is_enabled`/`code` (superfície mínima, mirror `BankOptionItem`). Backend
// força `is_enabled=true` sempre no servidor, mesmo sem o client pedir.
// NUNCA usar `listTypeTitles`/`TypeTitleListItem` (CRUD completo, gated)
// neste select — mirror exato de `listBankOptions`/`BankOptionItem`.
// ============================================

export interface TypeTitleOptionItem {
  uuid: string;
  description: string;
  type: 1 | 2 | 3;
  type_label: string;
  factor: 1 | 2;
  factor_label: string;
}

export interface TypeTitleOptionsListEnvelope {
  success: boolean;
  message: string;
  data: TypeTitleOptionItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

// ============================================
// REQUEST TYPES (TASK-TT-02)
// ============================================

export interface TypeTitlePayload {
  description: string;
  type: 1 | 2 | 3;
  factor: 1 | 2;
  is_enabled: boolean;
  // `code` fica de fora — não é campo deste formulário (fiel ao legado).
}

// ============================================
// REACT HOOK FORM (TASK-TT-02)
// ============================================
// `type`/`factor` guardam STRING no form ('1'|'2'|'3'/'1'|'2') — o <Select>
// do projeto trabalha melhor com string; a conversão para Number() só
// acontece no payload do submit (mesma convenção de `condition` em
// PlanAccountForm — ver CreateOrUpdateTipoTitulo.tsx).

export interface TypeTitleForm {
  uuid?: string;
  description: string;
  type: '1' | '2' | '3' | '';
  factor: '1' | '2' | '';
  is_enabled: boolean;
}

// ============================================
// FILTRO (drawer da listagem — TASK-TT-01)
// ============================================
// `is_enabled`/`type` vão como STRING crua na querystring (mesma convenção de
// `is_enabled` em CategoryMatrix/LowReason) — o backend (TypeTitleFilterData,
// Spatie Data) coage a string numérica de `type` para int automaticamente e
// usa #[WithCast(BuiltinTypeCast::class,'bool')] para `is_enabled`. `factor`
// NÃO é filtrável — não foi pedido e o backend não suporta
// (TypeTitleFilterData só tem search/is_enabled/type/per_page).

export interface TypeTitleFilterForm {
  /** Busca por `description` (param `search` do backend). */
  search?: string;
  /** Status — Select estático Ativo/Inativo. */
  is_enabled?: 'true' | 'false';
  /** Tipo — Select estático Pagar(1)/Receber(2)/Ambas(3). */
  type?: '1' | '2' | '3';
}
