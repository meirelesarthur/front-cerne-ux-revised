// src/pages/CadastrosBase/NaturezaOperacao/nature-operation-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Natureza de Operação — padrão da
// empresa: FUNÇÃO que recebe `languageGB` e devolve o schema (mensagens i18n).
// Mirror mecânico de CentroCusto/centro-custo-schema.ts (bloco condicional
// grande) + RegrasFiscais/tax-rule-schema.ts (bloco fiscal).
//
// Estrutura (contrato §4.3, DA-NO-18 opção (b) — DIVERGE da recomendação
// original do Arquiteto, decisão explícita do dono):
//   - 13 campos "Geral" — SEMPRE `required`/`nullable` fixos, SEM `.when()`.
//     Os 4 CFOPs principais (`cfop_saida_interno/externo`,
//     `cfop_entrada_interno/externo`) são sempre obrigatórios independente do
//     valor de `tipo` (RN-1, contrato §7) — o toggle visual não os retira do
//     schema. Os 2 CFOPs de exportação são opcionais, mas validam o MESMO
//     formato (4 dígitos numéricos) quando preenchidos.
//   - 27 campos `required_if` (14 clássicos + 13 da Reforma Tributária) usam
//     `.when('overwrite_product', { is: (v) => v === true || v === 'true',
//     then: (schema) => schema.required(...), otherwise: (schema) =>
//     schema.notRequired() })` — a MESMA condição em TODOS os 27, nunca
//     misturar formatos entre campos (requisito explícito da Tarefa). Forma
//     `then: (schema) => schema...` CONFIRMADA em runtime contra a versão do
//     Yup deste projeto (`centro-custo-schema.ts`/`family-equipment-schema.ts`).
//   - 7 campos `.ignore` (`tax_rule_uuid`, `additional_info_uuid`,
//     `c_class_trib`, `cst_ibs_cbs`, `cst_is`, `tp_cred_pres_ibs_zfm`,
//     `ind_doacao`) ficam `nullable().notRequired()` FIXOS, SEM `.when()` —
//     NUNCA ficam obrigatórios, em nenhum valor de `overwrite_product`
//     (mirror exato do `.ignore` do Blade legado — DA-NO-18).
//
// Requisito crítico do dono (contrato §4.3/§7 item 3): quando
// `overwrite_product=false`, nenhum dos 27 campos bloqueia o submit — a
// branch `otherwise` NUNCA usa `.required()`.
//
// 3 exceções de teto (contrato §2, `NatureOperationRequest.php:132-134`):
// `perc_is_espec`/`ad_rem_ibs`/`ad_rem_cbs` validam só `min(0)`, SEM `.max()`
// — diferente dos outros 10 percentuais da Reforma (`max: 999.9999`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

// Condição ÚNICA usada nos 27 `.when('overwrite_product', ...)` — cobre os 2
// formatos possíveis que o Select de `overwrite_product` pode assumir
// (boolean nativo ou string 'true'/'false'), mesmo requisito literal da
// Tarefa. Este formulário usa `Option<boolean>` (boolean nativo) — a checagem
// de string fica como defesa extra, nunca é o caminho normal.
const isOverwriteProductEnabled = (value: unknown) => value === true || value === 'true';

// Formato de CFOP — sempre 4 dígitos numéricos (contrato DA-NO-09).
const CFOP_REGEX = /^\d{4}$/;

export const natureOperationSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.natureOperations.natureOperation.form.validation;

  const requiredCfop = () =>
    yup.string().required(messages.requiredField).matches(CFOP_REGEX, messages.cfopFormat);

  const optionalCfop = () =>
    yup
      .string()
      .nullable()
      .notRequired()
      .test('cfop-format-if-filled', messages.cfopFormat, (value) => {
        if (!value) return true;
        return CFOP_REGEX.test(value);
      });

  // Fábrica dos 13 percentuais/CST `required_if` — 2 "sabores": os 4
  // clássicos (`decimal:2`, teto `999.99`) e os 9 da Reforma Tributária COM
  // teto (`decimal:4`, teto `999.9999`). Os 3 SEM teto (`perc_is_espec`/
  // `ad_rem_ibs`/`ad_rem_cbs`) são declarados manualmente abaixo (exceção
  // literal do contrato).
  const requiredIfPercentage = (max: number, rangeMessage: string) =>
    yup
      .number()
      .typeError(messages.requiredField)
      .nullable()
      .when('overwrite_product', {
        is: isOverwriteProductEnabled,
        then: (schema) =>
          schema.required(messages.requiredField).min(0, rangeMessage).max(max, rangeMessage),
        otherwise: (schema) => schema.min(0, rangeMessage).notRequired(),
      });

  const requiredIfPercentageNoMax = () =>
    yup
      .number()
      .typeError(messages.requiredField)
      .nullable()
      .when('overwrite_product', {
        is: isOverwriteProductEnabled,
        then: (schema) => schema.required(messages.requiredField).min(0, messages.nonNegative),
        otherwise: (schema) => schema.min(0, messages.nonNegative).notRequired(),
      });

  const requiredIfString = () =>
    yup
      .string()
      .nullable()
      .when('overwrite_product', {
        is: isOverwriteProductEnabled,
        then: (schema) => schema.required(messages.requiredField),
        otherwise: (schema) => schema.notRequired(),
      });

  const requiredIfNumber = () =>
    yup
      .number()
      .typeError(messages.requiredField)
      .nullable()
      .when('overwrite_product', {
        is: isOverwriteProductEnabled,
        then: (schema) => schema.required(messages.requiredField),
        otherwise: (schema) => schema.notRequired(),
      });

  return yup.object({
    // ---- Grupo "Geral" (13 campos) — SEMPRE required/nullable, SEM .when() ----
    descricao: yup
      .string()
      .trim()
      .required(messages.requiredField)
      .max(80, messages.descricaoMaxLength),
    tipo: yup.number().oneOf([0, 1], messages.requiredField).required(messages.requiredField),
    // Os 4 CFOPs principais são SEMPRE obrigatórios, independente de `tipo`
    // (RN-1, contrato §7) — o toggle visual (CSS display) nunca os retira do
    // schema.
    cfop_saida_interno: requiredCfop(),
    cfop_saida_externo: requiredCfop(),
    cfop_entrada_interno: requiredCfop(),
    cfop_entrada_externo: requiredCfop(),
    cfop_saida_exportacao: optionalCfop(),
    cfop_entrada_exportacao: optionalCfop(),
    ativo: yup.boolean().required(messages.requiredField),
    sobrescreve_cfop_produto: yup.boolean().required(messages.requiredField),
    // Gatilho do bloco fiscal condicional (DA-NO-18) — sempre obrigatório em
    // si mesmo (Select Sim/Não, nunca vazio).
    overwrite_product: yup.boolean().required(messages.requiredField),
    generate_financial: yup.boolean().required(messages.requiredField),
    automatic_calculation: yup.boolean().required(messages.requiredField),

    // ---- FKs (.ignore — SEMPRE opcionais, nunca dentro de um .when()) ------
    tax_rule_uuid: yup.object().nullable().notRequired(),
    additional_info_uuid: yup.object().nullable().notRequired(),

    // ---- Bloco Fiscal Clássico (14 required_if — decimal:2, teto 999.99) ---
    cst_csosn: requiredIfString(),
    cst_pis: requiredIfString(),
    cst_cofins: requiredIfString(),
    cst_ipi: requiredIfString(),
    perc_icms: requiredIfPercentage(999.99, messages.percentageRange),
    perc_pis: requiredIfPercentage(999.99, messages.percentageRange),
    perc_cofins: requiredIfPercentage(999.99, messages.percentageRange),
    perc_ipi: requiredIfPercentage(999.99, messages.percentageRange),
    origem: requiredIfString(),
    cest: yup
      .string()
      .nullable()
      .max(10, messages.maxLength10)
      .when('overwrite_product', {
        is: isOverwriteProductEnabled,
        then: (schema) => schema.required(messages.requiredField),
        otherwise: (schema) => schema.notRequired(),
      }),
    percent_reduction: requiredIfPercentage(999.99, messages.percentageRange),
    // C1 (D-101-19): sempre opcionais (nullable), faixa 0-100; o dominio de mot_des_icms por CST
    // e validado pela API (422 por campo).
    mot_des_icms: yup.number().nullable().notRequired(),
    perc_dif: yup
      .number()
      .typeError(messages.percentageRange100)
      .min(0, messages.percentageRange100)
      .max(100, messages.percentageRange100)
      .nullable()
      .notRequired(),
    perc_fcp: yup
      .number()
      .typeError(messages.percentageRange100)
      .min(0, messages.percentageRange100)
      .max(100, messages.percentageRange100)
      .nullable()
      .notRequired(),
    modality_bc: requiredIfNumber(),
    cenq_ipi: requiredIfString(),
    // Reaproveita a MESMA lista de `cst_csosn` (DA-NO-05) — validação idêntica.
    cst_csosn_exp: requiredIfString(),

    // ---- Reforma Tributária — IBS/CBS/IS (13 required_if + 5 .ignore) ------
    // 5 .ignore — SEMPRE opcionais, nunca dentro de um .when():
    c_class_trib: yup.string().nullable().notRequired().max(6, messages.maxLength6),
    cst_ibs_cbs: yup.string().nullable().notRequired(),
    cst_is: yup.string().nullable().notRequired(),
    tp_cred_pres_ibs_zfm: yup.number().typeError(messages.requiredField).nullable().notRequired(),
    ind_doacao: yup
      .string()
      .nullable()
      .notRequired()
      .oneOf([null, 'true', 'false'], messages.requiredField),
    // 13 required_if — decimal:4, teto 999.9999 (10) OU sem teto (3, exceção
    // literal do contrato — `NatureOperationRequest.php:132-134`):
    perc_ibs_uf: requiredIfPercentage(999.9999, messages.percentageRange4),
    perc_ibs_mun: requiredIfPercentage(999.9999, messages.percentageRange4),
    perc_reducao_aliq_ibs_uf: requiredIfPercentage(999.9999, messages.percentageRange4),
    perc_reducao_aliq_ibs_mun: requiredIfPercentage(999.9999, messages.percentageRange4),
    perc_dif_ibs_uf: requiredIfPercentage(999.9999, messages.percentageRange4),
    perc_dif_ibs_mun: requiredIfPercentage(999.9999, messages.percentageRange4),
    perc_cbs: requiredIfPercentage(999.9999, messages.percentageRange4),
    perc_reducao_aliq_cbs: requiredIfPercentage(999.9999, messages.percentageRange4),
    perc_dif_cbs: requiredIfPercentage(999.9999, messages.percentageRange4),
    perc_is: requiredIfPercentage(999.9999, messages.percentageRange4),
    // 3 exceções de teto (SEM `.max()` — contrato não define teto):
    perc_is_espec: requiredIfPercentageNoMax(),
    ad_rem_ibs: requiredIfPercentageNoMax(),
    ad_rem_cbs: requiredIfPercentageNoMax(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const natureOperationSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(natureOperationSchema(languageGB));

export default natureOperationSchemaResolver;
