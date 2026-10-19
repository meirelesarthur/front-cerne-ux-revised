// src/pages/Fiscal/NfeEmitidas/nfe-nature-cascade.ts
// -----------------------------------------------------------------------------
// Rotinas compartilhadas de aplicação da sobrescrita fiscal da Natureza de
// Operação a TODOS os itens da NF-e — extraídas do bloco "Natureza → cascata
// fiscal" de `CreateOrUpdateNfe.tsx` (NFE-R2-006/007) para virarem funções
// NOMEADAS e reutilizáveis (TASK-FE-036-D6, GAP-FE-036-237, DEC-122):
//
//   - a cascata Natureza→itens (useEffect no watch de `natureza_uuid`,
//     `CreateOrUpdateNfe.tsx`) já as chamava inline;
//   - a cascata Produto→item (useEffect no watch de `items.${index}.
//     product_uuid`, `NfeItemsTab.tsx`) PRECISA reaplicar a MESMA rotina a
//     TODOS os itens quando `overwrite_product`/`sobrescreve_cfop_produto`
//     estiverem ligados (mirror `.trigger('change')` global do legado,
//     `MAPA-nfe-fin-fiscal.md` §D6) — sem duplicar os ~24 `setValue` entre os
//     dois `useEffect`s.
//
// Nenhuma regra nova: mirror 1:1 do que já rodava inline em
// `CreateOrUpdateNfe.tsx` antes desta extração.
// -----------------------------------------------------------------------------

import { sanitizeC1ForCst } from '@/constants/Fiscal/fiscal-field-visibility';

import type { NatureOperationData } from '@/@types/v2/NatureOperations';
import type { NfeForm, NfeItemForm } from '@/@types/v2/Nfes';

import type { UseFormSetValue } from 'react-hook-form';

/**
 * Aplica CFOP interno/externo de TODOS os itens a partir da Natureza,
 * respeitando `sobrescreve_cfop_produto`/`overwrite_product` e o sentido
 * (`tipo`: 0 = Entrada, demais = Saída). Sem efeito se nenhuma das duas
 * flags estiver ligada — mirror `_forms.blade.php:647-729`.
 * @param {NatureOperationData} natureData - Detalhe da Natureza selecionada.
 * @param {number | null | undefined} tipo - `tipo` (Operação) atual do form.
 * @param {NfeItemForm[]} items - Itens ATUAIS do form (`watch('items')`).
 * @param {UseFormSetValue<NfeForm>} setValue - `setValue` do form raiz.
 * @return {void}
 */
export function applyNatureCfopToAllItems(
  natureData: NatureOperationData,
  tipo: number | null | undefined,
  items: NfeItemForm[],
  setValue: UseFormSetValue<NfeForm>
): void {
  if (!natureData.sobrescreve_cfop_produto && !natureData.overwrite_product) return;

  const cfopSaidaInterno =
    tipo === 0 ? natureData.cfop_entrada_interno : natureData.cfop_saida_interno;
  const cfopSaidaExterno =
    tipo === 0 ? natureData.cfop_entrada_externo : natureData.cfop_saida_externo;

  items.forEach((_item, index) => {
    setValue(`items.${index}.cfop_saida_interno`, cfopSaidaInterno, { shouldValidate: false });
    setValue(`items.${index}.cfop_saida_externo`, cfopSaidaExterno, { shouldValidate: false });
  });
}

/**
 * Reaplica os ~24 campos fiscais da Natureza a TODOS os itens quando
 * `overwrite_product=true` (mirror `.trigger('change')` global do legado —
 * trocar a Natureza OU trocar o Produto de um item reaplicam esta MESMA
 * rotina a todos os cards de item já existentes). Sem efeito se
 * `overwrite_product` estiver desligado.
 * @param {NatureOperationData} natureData - Detalhe da Natureza selecionada.
 * @param {NfeItemForm[]} items - Itens ATUAIS do form (`watch('items')`).
 * @param {UseFormSetValue<NfeForm>} setValue - `setValue` do form raiz.
 * @return {void}
 */
export function applyNatureOverwriteToAllItems(
  natureData: NatureOperationData,
  items: NfeItemForm[],
  setValue: UseFormSetValue<NfeForm>
): void {
  if (!natureData.overwrite_product) return;

  items.forEach((_item, index) => {
    setValue(`items.${index}.cst_csosn`, natureData.cst_csosn, { shouldValidate: false });
    setValue(`items.${index}.cst_pis`, natureData.cst_pis, { shouldValidate: false });
    setValue(`items.${index}.cst_cofins`, natureData.cst_cofins, { shouldValidate: false });
    setValue(`items.${index}.cst_ipi`, natureData.cst_ipi, { shouldValidate: false });
    setValue(`items.${index}.cenq_ipi`, natureData.cenq_ipi, { shouldValidate: false });
    setValue(`items.${index}.perc_icms`, natureData.perc_icms, { shouldValidate: false });
    setValue(`items.${index}.perc_pis`, natureData.perc_pis, { shouldValidate: false });
    setValue(`items.${index}.perc_cofins`, natureData.perc_cofins, { shouldValidate: false });
    setValue(`items.${index}.perc_ipi`, natureData.perc_ipi, { shouldValidate: false });
    setValue(`items.${index}.cest`, natureData.cest, { shouldValidate: false });
    setValue(`items.${index}.percent_reduction`, natureData.percent_reduction, {
      shouldValidate: false,
    });
    // C1 (D-101-19): natureza -> item igual a `percent_reduction`, filtrado pelo CST da natureza.
    const natureC1 = sanitizeC1ForCst(natureData.cst_csosn, {
      mot_des_icms: natureData.mot_des_icms,
      perc_dif: natureData.perc_dif,
      perc_fcp: natureData.perc_fcp,
    });
    setValue(`items.${index}.mot_des_icms`, natureC1.mot_des_icms, { shouldValidate: false });
    setValue(`items.${index}.perc_dif`, natureC1.perc_dif, { shouldValidate: false });
    setValue(`items.${index}.perc_fcp`, natureC1.perc_fcp, { shouldValidate: false });
    setValue(`items.${index}.modality_bc`, natureData.modality_bc, { shouldValidate: false });
    setValue(`items.${index}.origem`, natureData.origem, { shouldValidate: false });
    setValue(`items.${index}.cst_csosn_exp`, natureData.cst_csosn_exp, { shouldValidate: false });
    setValue(`items.${index}.c_class_trib`, natureData.c_class_trib, { shouldValidate: false });
    setValue(`items.${index}.cst_ibs_cbs`, natureData.cst_ibs_cbs, { shouldValidate: false });
    setValue(`items.${index}.perc_ibs_uf`, natureData.perc_ibs_uf, { shouldValidate: false });
    setValue(`items.${index}.perc_ibs_mun`, natureData.perc_ibs_mun, { shouldValidate: false });
    setValue(`items.${index}.perc_reducao_aliq_ibs_uf`, natureData.perc_reducao_aliq_ibs_uf, {
      shouldValidate: false,
    });
    setValue(`items.${index}.perc_reducao_aliq_ibs_mun`, natureData.perc_reducao_aliq_ibs_mun, {
      shouldValidate: false,
    });
    setValue(`items.${index}.perc_dif_ibs_uf`, natureData.perc_dif_ibs_uf, {
      shouldValidate: false,
    });
    setValue(`items.${index}.perc_dif_ibs_mun`, natureData.perc_dif_ibs_mun, {
      shouldValidate: false,
    });
    setValue(`items.${index}.perc_cbs`, natureData.perc_cbs, { shouldValidate: false });
    setValue(`items.${index}.perc_reducao_aliq_cbs`, natureData.perc_reducao_aliq_cbs, {
      shouldValidate: false,
    });
    setValue(`items.${index}.perc_dif_cbs`, natureData.perc_dif_cbs, { shouldValidate: false });
    setValue(`items.${index}.cst_is`, natureData.cst_is, { shouldValidate: false });
    setValue(`items.${index}.perc_is`, natureData.perc_is, { shouldValidate: false });
    setValue(`items.${index}.perc_is_espec`, natureData.perc_is_espec, { shouldValidate: false });
    setValue(`items.${index}.ad_rem_ibs`, natureData.ad_rem_ibs, { shouldValidate: false });
    setValue(`items.${index}.ad_rem_cbs`, natureData.ad_rem_cbs, { shouldValidate: false });
    setValue(`items.${index}.tp_cred_pres_ibs_zfm`, natureData.tp_cred_pres_ibs_zfm, {
      shouldValidate: false,
    });
    setValue(`items.${index}.ind_doacao`, natureData.ind_doacao ? '1' : '', {
      shouldValidate: false,
    });
  });
}
