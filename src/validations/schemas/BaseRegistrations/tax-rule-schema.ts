// src/validations/schemas/BaseRegistrations/tax-rule-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Regra Fiscal — padrão da empresa:
// FUNÇÃO que recebe `languageGB` e devolve o schema (mensagens i18n). Mirror
// mecânico de CentroCusto/centro-custo-schema.ts.
//
// PARTE 1 (TASK-FE-112) — 17 campos de "Identificação"/"Fiscal Clássico",
// TODOS `required` exceto `cest`/`cbenef` (contrato de API §10).
//
// PARTE 2 (TASK-FE-113) — os 18 campos de "Reforma Tributária"/"ZFM/Doação",
// TODOS `nullable`/`notRequired` (contrato de API §10 — nenhum é obrigatório).
// `c_class_trib`/`cst_ibs_cbs`/`cst_is` seguem o MESMO racional de
// `cst_csosn_exp` (Parte 1): `Select` estático já restringe a seleção às
// chaves vindas de `/options`, então o schema só valida tipo/nulidade — sem
// `oneOf` redundante contra uma lista dinâmica (nenhum precedente do projeto
// faz isso em Yup para campos alimentados por fetch). Os 13 percentuais
// (`decimal(7,4)` a maioria, `perc_is_espec`/`ad_rem_ibs`/`ad_rem_cbs`
// `decimal(13,4)`) validam só tipo + não-negativo — sem `min`/`max` de
// negócio conhecido (task-packet não define teto para estes 3).
//
// `is_enabled`/`ind_doacao` validam como STRING ('true'/'false') — mesma
// convenção de `ProductGroupFormType.is_enabled`/`TenantParameterForm` (o
// componente Select trabalha com valores string). A conversão para o
// `boolean` real do payload acontece em `CreateOrUpdateRegraFiscal.tsx`.
//
// `modality_bc`/`tp_cred_pres_ibs_zfm` validam como NUMBER — os Selects que os
// alimentam usam `Option<number>` (mirror `CentroCusto.condition`, mas aqui o
// valor já É number nativamente, sem conversão adicional no submit).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const taxRuleSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.taxRules.taxRule.form.validation;

  return yup.object({
    // -- Identificação --
    name: yup.string().trim().required(messages.nameRequired).max(100, messages.nameMaxLength),
    is_enabled: yup
      .string()
      .oneOf(['true', 'false'], messages.requiredField)
      .required(messages.requiredField),

    // -- Fiscal Clássico (17 campos, TODOS required exceto cest/cbenef) --
    cfop_saida_interno: yup.string().required(messages.requiredField).max(4, messages.maxLength4),
    cfop_saida_externo: yup.string().required(messages.requiredField).max(4, messages.maxLength4),
    cst_csosn: yup.string().required(messages.requiredField),
    cst_csosn_exp: yup.string().nullable().notRequired(),
    cst_pis: yup.string().required(messages.requiredField),
    cst_cofins: yup.string().required(messages.requiredField),
    cst_ipi: yup.string().required(messages.requiredField),
    perc_icms: yup
      .number()
      .typeError(messages.requiredField)
      .min(0, messages.percentageRange)
      .max(999.99, messages.percentageRange)
      .required(messages.requiredField),
    perc_pis: yup
      .number()
      .typeError(messages.requiredField)
      .min(0, messages.percentageRange)
      .max(999.99, messages.percentageRange)
      .required(messages.requiredField),
    perc_cofins: yup
      .number()
      .typeError(messages.requiredField)
      .min(0, messages.percentageRange)
      .max(999.99, messages.percentageRange)
      .required(messages.requiredField),
    perc_ipi: yup
      .number()
      .typeError(messages.requiredField)
      .min(0, messages.percentageRange)
      .max(999.99, messages.percentageRange)
      .required(messages.requiredField),
    percent_reduction: yup
      .number()
      .typeError(messages.requiredField)
      .min(0, messages.percentageRange)
      .max(999.99, messages.percentageRange)
      .required(messages.requiredField),
    origem: yup.string().required(messages.requiredField),
    cest: yup.string().nullable().notRequired().max(10, messages.maxLength10),
    modality_bc: yup.number().typeError(messages.requiredField).required(messages.requiredField),
    cenq_ipi: yup.string().required(messages.requiredField),
    cbenef: yup.string().nullable().notRequired().max(255, messages.maxLength255),

    // -- C1 (D-101-19) -- nullable; faixa 0-100 (4 casas). O dominio de `mot_des_icms` por
    //    CST e a regra de CST 51/FCP sao tratados na tela e validados pela API (422).
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

    // -- Reforma Tributária — IBS/CBS/IS + ZFM/Doação (18 campos, TASK-FE-113,
    //    TODOS nullable/notRequired — contrato de API §10) --
    c_class_trib: yup.string().nullable().notRequired(),
    cst_ibs_cbs: yup.string().nullable().notRequired(),
    perc_ibs_uf: yup
      .number()
      .typeError(messages.nonNegative)
      .min(0, messages.nonNegative)
      .nullable()
      .notRequired(),
    perc_ibs_mun: yup
      .number()
      .typeError(messages.nonNegative)
      .min(0, messages.nonNegative)
      .nullable()
      .notRequired(),
    perc_reducao_aliq_ibs_uf: yup
      .number()
      .typeError(messages.nonNegative)
      .min(0, messages.nonNegative)
      .nullable()
      .notRequired(),
    perc_reducao_aliq_ibs_mun: yup
      .number()
      .typeError(messages.nonNegative)
      .min(0, messages.nonNegative)
      .nullable()
      .notRequired(),
    perc_dif_ibs_uf: yup
      .number()
      .typeError(messages.nonNegative)
      .min(0, messages.nonNegative)
      .nullable()
      .notRequired(),
    perc_dif_ibs_mun: yup
      .number()
      .typeError(messages.nonNegative)
      .min(0, messages.nonNegative)
      .nullable()
      .notRequired(),
    perc_cbs: yup
      .number()
      .typeError(messages.nonNegative)
      .min(0, messages.nonNegative)
      .nullable()
      .notRequired(),
    perc_reducao_aliq_cbs: yup
      .number()
      .typeError(messages.nonNegative)
      .min(0, messages.nonNegative)
      .nullable()
      .notRequired(),
    perc_dif_cbs: yup
      .number()
      .typeError(messages.nonNegative)
      .min(0, messages.nonNegative)
      .nullable()
      .notRequired(),
    cst_is: yup.string().nullable().notRequired(),
    perc_is: yup
      .number()
      .typeError(messages.nonNegative)
      .min(0, messages.nonNegative)
      .nullable()
      .notRequired(),
    // Sem min/max de negócio conhecido (task-packet não define teto) — só
    // tipo + não-negativo, mesmo racional dos demais percentuais.
    perc_is_espec: yup
      .number()
      .typeError(messages.nonNegative)
      .min(0, messages.nonNegative)
      .nullable()
      .notRequired(),
    ad_rem_ibs: yup
      .number()
      .typeError(messages.nonNegative)
      .min(0, messages.nonNegative)
      .nullable()
      .notRequired(),
    ad_rem_cbs: yup
      .number()
      .typeError(messages.nonNegative)
      .min(0, messages.nonNegative)
      .nullable()
      .notRequired(),
    tp_cred_pres_ibs_zfm: yup.number().typeError(messages.requiredField).nullable().notRequired(),
    ind_doacao: yup
      .string()
      .nullable()
      .notRequired()
      .oneOf([null, 'true', 'false'], messages.requiredField),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const taxRuleSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(taxRuleSchema(languageGB));

export default taxRuleSchemaResolver;
