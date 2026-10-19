// src/@types/v2/TaxRules/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de REGRAS FISCAIS (TaxRule — Cadastros Base / Fiscal).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /tax-rules            → data: TaxRuleListItem[], meta com paginação
//                                   REAL (ApiResponse::paginated), default 10,
//                                   aceita page/per_page/search.
//   GET    /tax-rules/{uuid}     → data: TaxRuleData (~32 campos de negócio)
//   POST   /tax-rules            → payload TaxRulePayload (SEMPRE completo —
//                                   TaxRuleRequest::rules() não diferencia por
//                                   verbo)
//   PUT    /tax-rules/{uuid}     → payload TaxRulePayload (idem)
//   DELETE /tax-rules/{uuid}     → 204; exclusão FÍSICA, SEM guarda de FK
//                                   (nullOnDelete() físico confirmado no
//                                   contrato de API §2.2)
//   GET    /tax-rules/options    → data: TaxRuleOptionsData — payload
//                                   ESTÁTICO, 8 chaves, FORA do bloco
//                                   farm.context (só auth:sanctum, sem gate de
//                                   permissão nem de farm ativa).
//
// Fonte EXAUSTIVA dos campos: TaxRule-contrato.md §9 (tabela de camadas) / §10
// (tabela de validação). NUNCA incluir `u_trib_is`/`code`/
// `automatic_calculation` — fora do contrato de API v1 (§3 do contrato de
// API), nunca tiveram consumidor de UI.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// TAX RULE (resposta da API)
// ============================================

export interface TaxRuleListItem {
  uuid: string;
  name: string;
  is_enabled: boolean;
}

// Shape de saída (GET show) — TODOS os campos de negócio do TaxRuleResource.
export interface TaxRuleData extends TaxRuleListItem {
  // -- Fiscal Clássico (17 campos, TASK-FE-112) --
  cfop_saida_interno: string;
  cfop_saida_externo: string;
  cst_csosn: string;
  cst_csosn_exp: string | null;
  cst_pis: string;
  cst_cofins: string;
  cst_ipi: string;
  perc_icms: number;
  perc_pis: number;
  perc_cofins: number;
  perc_ipi: number;
  percent_reduction: number;
  // -- C1 (D-101-19) -- API C1 (contrato final do executor).
  // Nullable; NULL = comportamento atual. `mot_des_icms` depende do CST (dominio por grupo).
  mot_des_icms?: number | null;
  perc_dif?: number | null; // 0-100, 4 casas; so CST 51
  perc_fcp?: number | null; // 0-100, 4 casas; 0 tratado como vazio
  origem: string;
  cest: string | null;
  modality_bc: number;
  cenq_ipi: string;
  cbenef: string | null;
  // -- Reforma Tributária — IBS/CBS/IS + ZFM/Doação (19 campos, TASK-FE-113) --
  c_class_trib: string | null;
  cst_ibs_cbs: string | null;
  perc_ibs_uf: number | null;
  perc_ibs_mun: number | null;
  perc_reducao_aliq_ibs_uf: number | null;
  perc_reducao_aliq_ibs_mun: number | null;
  perc_dif_ibs_uf: number | null;
  perc_dif_ibs_mun: number | null;
  perc_cbs: number | null;
  perc_reducao_aliq_cbs: number | null;
  perc_dif_cbs: number | null;
  cst_is: string | null;
  perc_is: number | null;
  perc_is_espec: number | null;
  ad_rem_ibs: number | null;
  ad_rem_cbs: number | null;
  tp_cred_pres_ibs_zfm: number | null;
  ind_doacao: boolean | null;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface TaxRulesApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface TaxRulesListEnvelope {
  success: boolean;
  message: string;
  data: TaxRuleListItem[];
  errors: Record<string, string[]> | null;
  meta: TaxRulesApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES
// ============================================

// Payload de POST/PUT — mesmo shape de TaxRuleData, sem `uuid`. Payload
// SEMPRE completo (TaxRuleRequest::rules() não diferencia por verbo).
export type TaxRulePayload = Omit<TaxRuleData, 'uuid'>;

// ============================================
// REACT HOOK FORM (formulário create/edit)
// ============================================

// `is_enabled`/`ind_doacao` como string 'true'/'false' (Select, D3 do
// Maestro — NUNCA Switch), demais campos idênticos a TaxRuleData. `uuid`
// opcional (edição).
export interface TaxRuleForm extends Omit<TaxRuleData, 'uuid' | 'is_enabled' | 'ind_doacao'> {
  uuid?: string;
  is_enabled: 'true' | 'false';
  ind_doacao: 'true' | 'false' | null;
}

// ============================================
// FILTRO (drawer da listagem) — SÓ `search` (decisão TaxRule-contrato §16:
// fidelidade ao task-packet, is_enabled fica aditivo/não consumido)
// ============================================

export interface TaxRuleFilterForm {
  search?: string;
}

// ============================================
// GET /tax-rules/options — payload estático, 8 chaves, cada uma já no
// formato Option<T> do projeto (@/@types/option.d.ts).
// ============================================

export interface TaxRuleOptionsData {
  cst_csosn: Option<string>[];
  cst_pis_cofins: Option<string>[];
  cst_ipi: Option<string>[];
  cenq_ipi: Option<string>[];
  origem: Option<string>[];
  modality_bc: Option<number>[];
  cst_ibs_cbs: Option<string>[];
  tp_cred_pres_ibs_zfm: Option<number>[];
}

// ============================================
// GET /tax-rules/entity-options (TASK-BE-603, aditivo TASK-FE-941) — lookup
// ENXUTO de ENTIDADE para o `SelectAsyncPaginate` de `tax_rule_uuid`
// (`ProdutoEstoqueFinanceiroTab.tsx`, TASK-FE-941). Resource DEDICADO —
// shape `{uuid,label}`, DIFERENTE de `TaxRuleListItem` (`name`) e DIFERENTE
// de `TaxRuleOptionsData` acima (catálogo ESTÁTICO de enums fiscais,
// `options()`/TASK-BE-114, consumido pelo próprio formulário de Regra
// Fiscal — não confundir os dois `/options`). Catálogo PLANO, sem cascata
// (só `search`). SEM gate de permissão (`tax-rules_view` não se aplica) —
// tenancy automática via `TaxRuleTenantScope` (global scope do Model). FLAT
// (`ApiResponse::success`, `meta` sempre `null`).
// ============================================

export interface TaxRuleEntityOption {
  uuid: string;
  label: string;
}

export interface TaxRuleEntityOptionsListEnvelope {
  success: boolean;
  message: string;
  data: TaxRuleEntityOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// ============================================
// GET /tax-rules/{uuid}/fiscal-defaults (TASK-BE-604) — os 35 campos fiscais
// de UMA Regra Fiscal, para o autofill do formulário de Produto
// (TASK-FE-950). Resource DEDICADO no backend
// (`TaxRuleFiscalDefaultsResource`) — NUNCA inclui `uuid`/`name`/
// `is_enabled`/`tenant_id` (as 2 colisões incidentais do legado, Doc Bruta
// Product/02-Product-Autofill-Fiscal-TaxRule.md §2.1b, NÃO replicadas por
// decisão do dev). Derivado de `TaxRuleData` por `Omit` — mesmos 35 campos,
// mesmos tipos (fonte única de verdade, sem duplicar 35 declarações).
//
// ⚠️ `origem: string` aqui (herdado de `TaxRuleData`, backed
// `OrigemMercadoriaEnum: string`) DIVERGE do tipo do campo homônimo em
// `ProductForm` (`origem?: number | null` — coluna `Product.origem` é
// `int` cru, não um Enum-cast). ÚNICO dos 35 campos com essa divergência
// (os outros 6 campos-Enum do lado TaxRule — `modality_bc`/
// `tp_cred_pres_ibs_zfm` int-backed, `cst_csosn`/`cst_ipi`/`cst_ibs_cbs`/
// `cst_pis`/`cst_cofins` string-backed — casam exatamente com o tipo do
// campo homônimo em `ProductForm`). Quem aplicar este valor num
// `ProductForm.origem` via `setValue` DEVE coagir com `Number(...)`
// primeiro (ver `TASK-FE-950`) — não fazer isso aqui faria o Select de
// origem (`Option<number>`) não casar o valor aplicado.
// ============================================

export type TaxRuleFiscalDefaultsData = Omit<TaxRuleData, 'uuid' | 'name' | 'is_enabled'>;
