// src/@types/v2/DiscountTables/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Descontos/Classificação" (DiscountTable — Operacional/
// Agricultura, F-032, TASK-DT-FE-01). Shape confirmado por leitura direta de
// `DiscountTableListResource.php`/`DiscountTableResource.php`/
// `DiscountTableProductResource.php`/`DiscountRuleResource.php`/
// `EligibleProductResource.php`/`DiscountTableRequest.php` (`GB.Cerne.Api`,
// `97-Esteiras/052/CONTRATOS/discount-tables-contrato-migracao.md` §3-4).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /discount-tables                  → data: DiscountTableListItem[]
//                                               (Resource ENXUTO — `products`
//                                               já vem CONCATENADO em string
//                                               pelo backend, LM-04; SEM
//                                               `is_active` no índice).
//   GET    /discount-tables/product-options   → data: ProductOption[], lookup
//                                               único (tenant+group_id=8),
//                                               SEM paginação.
//   GET    /discount-tables/{uuid}            → data: DiscountTableDetail
//                                               (COM products[] + rules[]).
//   POST   /discount-tables                   → payload DiscountTablePayload.
//   PUT    /discount-tables/{uuid}             → payload DiscountTablePayload
//                                               — a API RECONCILIA (TR-03,
//                                               diff por produto e por
//                                               type+ordinal); o front envia
//                                               o estado final completo, SEM
//                                               uuid de regra.
//   DELETE /discount-tables/{uuid}             → soft delete (cascade
//                                               produtos+regras).
//
// `code` é SEMPRE server-authoritative (nunca aceito no payload de escrita —
// `DiscountTableRequest::rules()` confirmado por leitura direta não o
// declara; imutável em update). `product_uuid` (nunca `product_id`). Nunca
// `id` — sempre `uuid`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// ENUMS — união literal inline (decoupling: este arquivo não depende de
// import cruzado de `@/constants/discount-table/*`).
// ============================================

/** `GW`=Peso Bruto, `PD`=Peso Bruto - Desconto Anterior (`App\Enums\DiscountTableCalculationBase`). */
export type DiscountTableCalculationBase = 'GW' | 'PD';

/** `0`=Inativo, `1`=Ativo — físico `smallint` (LK-02, ordem 1 antes de 0). */
export type DiscountTableStatus = 0 | 1;

/** 6 tipos FIXOS de regra, ORDEM EXATA (CLM-17/`App\Enums\DiscountRuleType`):
 *  impureza, umidade, quebrado, esverdeado, avariado, taxa_recepcao. */
export type DiscountRuleType =
  'impureza' | 'umidade' | 'quebrado' | 'esverdeado' | 'avariado' | 'taxa_recepcao';

// ============================================
// REFERÊNCIAS ANINHADAS (resposta da API — enums expostos como {value,label})
// ============================================

export interface DiscountTableCalculationBaseRef {
  value: DiscountTableCalculationBase;
  label: string;
}

export interface DiscountRuleTypeRef {
  value: DiscountRuleType;
  label: string;
}

export interface DiscountTableProductRef {
  uuid: string;
  description: string;
  code: string;
}

export interface DiscountRuleRef {
  uuid: string;
  type: DiscountRuleTypeRef;
  initial_limit_percent: number;
  final_limit_percent: number;
  discount_percent: number;
}

/** `DiscountTableProductResource.php` — subcadastro Produtos, só em `DiscountTableDetail`. */
export interface DiscountTableProductDetailRef {
  uuid: string;
  product: DiscountTableProductRef;
  rules: DiscountRuleRef[];
}

// ============================================
// DISCOUNT TABLE (resposta da API)
// ============================================

/** `GET /discount-tables` — Resource ENXUTO de listagem (`DiscountTableListResource`):
 *  `products` já vem CONCATENADO server-side (LM-04, `pluck('product.description')->implode(', ')`)
 *  — NUNCA montar essa concatenação no front; SEM `is_active` (coluna não existe no índice). */
export interface DiscountTableListItem {
  uuid: string;
  code: string;
  name: string;
  calculation_base: DiscountTableCalculationBaseRef;
  /** String já concatenada (por vírgula) das descrições dos produtos vinculados. */
  products: string;
}

/** `GET /discount-tables/{uuid}` — Resource COMPLETO (`DiscountTableResource`). */
export interface DiscountTableDetail {
  uuid: string;
  code: string;
  name: string;
  calculation_base: DiscountTableCalculationBaseRef;
  is_active: DiscountTableStatus;
  products: DiscountTableProductDetailRef[];
  created_at: string | null;
  updated_at: string | null;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /discount-tables)
// ============================================

export interface DiscountTablesApiPaginationMeta {
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

export interface DiscountTablesListEnvelope {
  success: boolean;
  message: string;
  data: DiscountTableListItem[];
  errors: Record<string, string[]> | null;
  meta: DiscountTablesApiPaginationMeta | null;
}

// ============================================
// PRODUCT OPTIONS (GET /discount-tables/product-options — EligibleProductResource)
// ============================================

/** Lookup único (tenant + `group_id=8`, order `description` asc, LK-03/TR-06) — SEM paginação. */
export interface ProductOption {
  uuid: string;
  description: string;
  code: string;
}

export interface ProductOptionsEnvelope {
  success: boolean;
  message: string;
  data: ProductOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// FILTRO (drawer da listagem, TASK-DT-FE-02) — Contrato B, 1 campo (`search`,
// ILIKE code/name — `DiscountTableFilterData::$search`).
// ============================================

export interface DiscountTableFilterForm {
  search?: string;
}

// ============================================
// REACT HOOK FORM (formulário completo create/edit/view, TASK-DT-FE-03)
// ============================================

/** Linha de regra no RHF — percentuais como `number|string` (input controlado
 *  vazio nasce `''`, nunca `0` — BR-03 não migrado: aba nasce SEM linhas). */
export interface RuleRowForm {
  initial_limit_percent: number | string;
  final_limit_percent: number | string;
  discount_percent: number | string;
}

/** 6 buckets FIXOS de regra por produto, ORDEM EXATA (CLM-17) — cada bucket
 *  nasce vazio (BR-03 não migrado, nenhuma linha zerada automática). */
export interface DiscountTableProductRulesForm {
  impureza: RuleRowForm[];
  umidade: RuleRowForm[];
  quebrado: RuleRowForm[];
  esverdeado: RuleRowForm[];
  avariado: RuleRowForm[];
  taxa_recepcao: RuleRowForm[];
}

/** Produto do subcadastro (`useFieldArray products`) — `product_label` é
 *  display-only (`description (code)`), NUNCA vai ao wire. */
export interface DiscountTableProductForm {
  product_uuid: string;
  product_label: string;
  rules: DiscountTableProductRulesForm;
}

/** Formulário completo (create/edit/view). `code` OPCIONAL só para exibição
 *  readonly (`InputReadOnly`) — NUNCA registrado no `useForm`/wire. */
export interface DiscountTableForm {
  code?: string;
  name: string;
  calculation_base: Option<DiscountTableCalculationBase>;
  is_active: Option<DiscountTableStatus>;
  products: DiscountTableProductForm[];
}

// ============================================
// WIRE PAYLOAD (store/update — `DiscountTableRequest::rules()`)
// ============================================

/** `code` NUNCA no payload (server-gen, imutável em update). `type` vai como
 *  string crua do enum (NÃO `{value,label}` — isso é só na resposta). */
export interface DiscountRulePayload {
  type: DiscountRuleType;
  initial_limit_percent: number;
  final_limit_percent: number;
  discount_percent: number;
}

/** `product_uuid` (nunca `product_id`) — `rules` é array PLANO (achatado dos
 *  6 buckets do form), pode ser vazio para um produto sem nenhuma regra
 *  preenchida (`products.*.rules` é `present|array`, não `min:1`). */
export interface DiscountTableProductPayload {
  product_uuid: string;
  rules: DiscountRulePayload[];
}

/** Update SEMPRE envia o estado final completo — a API reconcilia (TR-03). */
export interface DiscountTablePayload {
  name: string;
  calculation_base: DiscountTableCalculationBase;
  is_active: DiscountTableStatus;
  products: DiscountTableProductPayload[];
}
