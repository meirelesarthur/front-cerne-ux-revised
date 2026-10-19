// src/@types/v2/NatureOperations/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de NATUREZA DE OPERAÇÃO (NatureOperation) — API v1 do
// backend Laravel GB.Cerne. Criado em TASK-NO-FE-01 (listagem paginada real +
// filtro `search`/`tipo`/`ativo` + exclusão bloqueada).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET    /nature-operations          → data: NatureOperationListItem[] +
//                                         meta REAL de paginação
//                                         (ApiResponse::paginated(),
//                                         current_page/last_page/per_page/
//                                         total).
//   GET    /nature-operations/{uuid}   → data: NatureOperationData (TASK-NO-FE-02)
//   POST   /nature-operations          → payload NatureOperationPayload
//                                         (SEMPRE completo — TASK-NO-FE-02)
//   PUT    /nature-operations/{uuid}   → payload NatureOperationPayload
//                                         (idem — TASK-NO-FE-02)
//   DELETE /nature-operations/{uuid}   → 204; 422 estruturado
//                                         (`errors.in_use[]`) se em uso por
//                                         CT-e/Devolução/NF-e emitida/
//                                         Transferência de NF-e
//                                         (DeleteNatureOperationAction, guarda
//                                         dupla dependencyUsageCounts()+catch
//                                         23503) — a `message` real já vem
//                                         pronta no envelope, exibida pelo
//                                         `onError` genérico do `useRequest`.
//
// TASK-NO-FE-01 criou `NatureOperationListItem`/`NatureOperationsListEnvelope`/
// `NatureOperationFilterForm`. TASK-NO-FE-02 (este bloco) ESTENDE com
// `NatureOperationData`/`NatureOperationPayload`/`NatureOperationForm` — shape
// 1:1 com `NatureOperationResource` (49 campos de negócio), contrato §2 (Schema
// da Tabela)/§4.2 (DTO)/§4.3 (Request — 27 `required_if:overwrite_product,true`
// + 7 `.ignore` sempre-opcionais, DA-NO-18 opção (b)).
//
// Fonte: `[[01-Arquitetura_e_Contratos/NatureOperation-contrato]]` (APROVADO,
// Ciclo 4, 100%), §2 (Schema)/§3 (Endpoints)/§4.2/§4.3/§4.7 (Resource), lido
// integralmente em TASK-NO-FE-01/02.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// NATURE OPERATION (resposta da API — shape usado pela listagem)
// ============================================

export interface NatureOperationListItem {
  uuid: string;
  code: number;
  descricao: string;
  tipo: number; // 0=Entrada, 1=Saída (TipoOperacaoEnum)
  ativo: boolean;
  // demais ~45 campos do NatureOperationResource também chegam no envelope
  // (o backend usa o MESMO Resource em index() e show() — sem ListItem
  // "magro" dedicado, NatureOperationController.php:53-62), mas a listagem
  // só RENDERIZA code/descricao/tipo/ativo — os campos extras ficam sem uso
  // nesta tela (a Tarefa irmã TASK-NO-FE-02 os consome no formulário).
  [key: string]: unknown;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — REAL)
// ============================================

// UT-000779 — resposta de POST /nature-operations/import-defaults (idempotente).
export interface NatureOperationImportDefaultsResult {
  created: number;
  existing: number;
}

export interface NatureOperationsListEnvelope {
  success: boolean;
  message: string;
  data: NatureOperationListItem[];
  errors: Record<string, string[]> | null;
  meta: { current_page: number; last_page: number; per_page: number; total: number } | null;
}

// ============================================
// FILTRO (drawer da listagem — TASK-NO-FE-01)
// ============================================

export interface NatureOperationFilterForm {
  /** Busca por `descricao`/`code` (param `search` do backend). */
  search?: string;
  /** 0=Entrada, 1=Saída — TipoOperacaoEnum. `null` quando "Todos". */
  tipo?: number | null;
  /** `null` quando "Todos" — nunca confundir com `false` (Inativo é um filtro real). */
  ativo?: boolean | null;
}

// ============================================
// FORMULÁRIO CREATE/EDIT (TASK-NO-FE-02) — shape 1:1 com
// `NatureOperationResource` (contrato §4.7): 49 campos de negócio + uuid/code/
// timestamps. `perc_icms`/`perc_pis`/`perc_cofins`/`perc_ipi`/
// `percent_reduction` (bloco clássico) NUNCA nulos (default físico 0.00,
// contrato §2) — os demais percentuais/CST/enum do bloco fiscal são
// `| null` (nullable físico, obrigatoriedade condicional fica só no Request,
// DA-NO-18).
// ============================================

export interface NatureOperationData {
  uuid: string;
  code: number;
  descricao: string;
  tipo: number; // 0=Entrada, 1=Saída — TipoOperacaoEnum
  cfop_saida_interno: string;
  cfop_saida_externo: string;
  cfop_saida_exportacao: string | null;
  cfop_entrada_interno: string;
  cfop_entrada_externo: string;
  cfop_entrada_exportacao: string | null;
  ativo: boolean;
  sobrescreve_cfop_produto: boolean;
  generate_financial: boolean; // semântica DIRETA (Achado 5) — true = gera financeiro
  overwrite_product: boolean; // gatilho do bloco fiscal condicional (DA-NO-18)
  automatic_calculation: boolean;
  additional_info_uuid: string | null;
  tax_rule_uuid: string | null;
  // -- Bloco Fiscal Clássico (14 required_if quando overwrite_product=true) --
  cst_csosn: string | null;
  cst_pis: string | null;
  cst_cofins: string | null;
  cst_ipi: string | null;
  perc_icms: number;
  perc_pis: number;
  perc_cofins: number;
  perc_ipi: number;
  origem: string | null;
  cest: string | null;
  cst_csosn_exp: string | null;
  modality_bc: number | null;
  percent_reduction: number;
  // -- C1 (D-101-19) -- API C1 (contrato final do executor).
  // Nullable; NULL = comportamento atual. `mot_des_icms` depende do CST (dominio por grupo).
  mot_des_icms?: number | null;
  perc_dif?: number | null; // 0-100, 4 casas; so CST 51
  perc_fcp?: number | null; // 0-100, 4 casas; 0 tratado como vazio
  cenq_ipi: string | null;
  // -- Reforma Tributária — IBS/CBS/IS (13 required_if + 5 .ignore sempre
  //    opcionais quando overwrite_product=true, DA-NO-18 opção (b)) --
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
  created_at: string | null;
  updated_at: string | null;
  // Sub-recursos resumidos, só quando presentes (`whenLoaded`, contrato §4.7)
  // — usados SÓ para reconstruir o `label` dos 2 Selects assíncronos em
  // `fillForm` (edição). NUNCA fazem parte do payload de escrita.
  additional_info?: { uuid: string; description: string } | null;
  tax_rule?: { uuid: string; name: string } | null;
}

// Payload de POST/PUT — mesmo shape de NatureOperationData, sem
// uuid/code/timestamps/sub-recursos. Payload SEMPRE completo (create E
// update — `NatureOperationRequest::rules()` não usa `sometimes` nos campos
// base, contrato §4.3).
export type NatureOperationPayload = Omit<
  NatureOperationData,
  'uuid' | 'code' | 'created_at' | 'updated_at' | 'additional_info' | 'tax_rule'
>;

// Shape do formulário (RHF). Diferenças em relação ao Payload:
//   - `tax_rule_uuid`/`additional_info_uuid` guardam o `Option<string>`
//     INTEIRO (mirror `parent_uuid` de PlanAccount/CentroCusto) — convertidos
//     para `.value` só no `tryPersist`.
//   - `ind_doacao` guarda STRING ('true'/'false'/null, 3 estados reais do
//     legado) — mesmo padrão de `TaxRuleForm.ind_doacao` — convertido para
//     `boolean | null` só no `tryPersist`.
export interface NatureOperationForm extends Omit<
  NatureOperationPayload,
  'additional_info_uuid' | 'tax_rule_uuid' | 'ind_doacao'
> {
  uuid?: string;
  additional_info_uuid: Option<string> | null;
  tax_rule_uuid: Option<string> | null;
  ind_doacao: 'true' | 'false' | null;
}
