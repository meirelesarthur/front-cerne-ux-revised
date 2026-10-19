// src/constants/cadastrosBase/product/product-fiscal-autofill-fields.ts
// -----------------------------------------------------------------------------
// Lista EXPLÍCITA dos 38 campos fiscais que o autofill de `tax_rule_uuid`
// aplica no formulário de Produto (TASK-FE-950, autopreenchimento pela
// Regra Fiscal — Doc Bruta Product/02-Product-Autofill-Fiscal-TaxRule.md).
//
// Decisão do dev (não re-litigar): lista HARDCODED, não um casamento
// genérico por nome como o legado (`_forms.blade.php:540-556`, que varria
// TODO `input`/`select` do form e copiava por nome de campo homônimo —
// mecanismo frágil que também colidiu incidentalmente com `tenant_id`/
// `is_enabled`, DEC-013, não replicados aqui). Se `TaxRuleFiscalDefaultsData`
// ganhar uma chave nova no futuro, ela SÓ passa a ser aplicada se alguém
// adicionar o nome aqui conscientemente.
//
// Ordem = ordem de `TaxRuleFiscalDefaultsResource::toArray()` (`TASK-BE-604`,
// `GB.Cerne.Api`) — 1:1 rastreável com o backend, não alfabética.
// -----------------------------------------------------------------------------

import type { ProductForm as ProductFormType } from '@/@types/v2/Products';
import type { TaxRuleFiscalDefaultsData } from '@/@types/v2/TaxRules';

export const PRODUCT_FISCAL_AUTOFILL_FIELDS: ReadonlyArray<
  keyof TaxRuleFiscalDefaultsData & keyof ProductFormType
> = [
  'cfop_saida_interno',
  'cfop_saida_externo',
  'cst_csosn',
  'cst_pis',
  'cst_cofins',
  'cst_ipi',
  'perc_icms',
  'perc_pis',
  'perc_cofins',
  'perc_ipi',
  'origem',
  'cest',
  'cst_csosn_exp',
  'modality_bc',
  'percent_reduction',
  'mot_des_icms',
  'perc_dif',
  'perc_fcp',
  'cenq_ipi',
  'cbenef',
  'c_class_trib',
  'cst_ibs_cbs',
  'perc_ibs_uf',
  'perc_ibs_mun',
  'perc_reducao_aliq_ibs_uf',
  'perc_reducao_aliq_ibs_mun',
  'perc_dif_ibs_uf',
  'perc_dif_ibs_mun',
  'perc_cbs',
  'perc_reducao_aliq_cbs',
  'perc_dif_cbs',
  'cst_is',
  'perc_is',
  'perc_is_espec',
  'ad_rem_ibs',
  'ad_rem_cbs',
  'tp_cred_pres_ibs_zfm',
  'ind_doacao',
] as const;
