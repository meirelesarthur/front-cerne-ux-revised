// src/pages/CadastrosBase/Autorizadores/authorizer-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Autorizador (RequestAuthorizer) —
// SLICE 2 (Lote 06 / esteira 089, Frente C, F-141). Padrão da empresa: FUNÇÃO
// que recebe `languageGB` e devolve o schema (mensagens i18n) — mirror
// mecânico de `CadastrosBase/CentroCusto/centro-custo-schema.ts`.
//
// `user_uuid` guarda o objeto `{label,value}` do `SelectAsyncPaginate`
// (nullable + required — Yup valida a PRESENÇA do objeto; a extração do
// `.value` cru acontece só no submit, `CreateOrUpdateAutorizador.tsx`).
//
// `farms` — `useFieldArray`, mínimo 1 linha (`farms.min(1)`, mirror
// `RequestAuthorizerRequest.farms => required|array|min:1`). `level` validado
// 1-4 por linha (mirror `farms.*.level => required|integer|between:1,4`).
//
// `rules` — só obrigatório (`min(1)`) quando `is_conditional === true`, via
// `.when('is_conditional', ...)` (mesma técnica condicional já confirmada em
// tempo de execução por `centro-custo-schema.ts` para `apportionments`/
// `type==='apportioned'`, node_modules/yup@0.32.11). Cada item de `rules`
// exige `type`/`value`/`apply_on` — mirror
// `rules.*.{type,value,apply_on} => required_with:rules`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const authorizerSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.requestAuthorizers.requestAuthorizer.form.validation;

  const farmItemSchema = yup.object({
    farm_uuid: yup.string().required(messages.farmFarmRequired),
    level: yup
      .number()
      .nullable()
      .typeError(messages.farmLevelRequired)
      .min(1, messages.farmLevelRange)
      .max(4, messages.farmLevelRange)
      .required(messages.farmLevelRequired),
  });

  const ruleItemSchema = yup.object({
    type: yup.string().required(messages.ruleTypeRequired),
    value: yup.string().trim().required(messages.ruleValueRequired),
    apply_on: yup
      .string()
      .oneOf(['A', 'D'], messages.ruleApplyOnRequired)
      .required(messages.ruleApplyOnRequired),
  });

  return yup.object({
    user_uuid: yup
      .object({
        label: yup.string().required(),
        value: yup.string().required(),
      })
      .nullable()
      .required(messages.userRequired),
    // "Até" é OBRIGATÓRIO, como no legado (`required` na UI e no servidor): vazio
    // é recusado; "0" e "0,00" são aceitos (legado grava 0.00 sem erro).
    max_value: yup
      .number()
      .transform((value, originalValue) =>
        originalValue === '' || originalValue === null ? undefined : value
      )
      .typeError(messages.maxValueRequired)
      .required(messages.maxValueRequired)
      .min(0, messages.maxValueRange),
    is_active: yup.boolean().required(),
    number_quotes: yup
      .number()
      .typeError(messages.numberQuotesRequired)
      .min(1, messages.numberQuotesMin)
      .required(messages.numberQuotesRequired),
    expense_organizer: yup.boolean().required(),
    is_conditional: yup.boolean().required(),
    farms: yup.array().of(farmItemSchema).min(1, messages.farmsRequired),
    rules: yup
      .array()
      .of(ruleItemSchema)
      .when('is_conditional', {
        is: true,
        then: (schema) => schema.min(1, messages.rulesRequired),
      }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const requestAuthorizerSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(authorizerSchema(languageGB));

export default requestAuthorizerSchemaResolver;
