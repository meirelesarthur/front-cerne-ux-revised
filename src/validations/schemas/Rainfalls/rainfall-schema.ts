// src/validations/schemas/Rainfalls/rainfall-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Pluviometria (Rainfall) —
// TASK-FE-041-PLV-01/03. Mirror `feedlotYard-schema.ts`/`deathAnimal-schema.ts`
// (Yup direto, `yup.object<Record<keyof T, yup.AnySchema>>()` + `yupResolver`)
// — NÃO existe `fieldValidationSchema()` no repo, não usar.
//
// `date` obrigatório (mirror `RainfallRequest::rules()`); `amount`
// obrigatório+numérico+intervalo `[0, 9999.9]` (mesmo `between:0,9999.9` do
// backend, `decimal(5,1)`); `areas` obrigatório+`min(1)` (mirror
// `Rule::exists('areas','uuid')->where('farm_id', ...)`, fecha DIV-003 do
// contrato legado por arquitetura).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { RainfallForm } from '@/@types/v2/Rainfalls';

export const rainfallSchema = (languageGB: LanguageDate) => {
  const msgs = languageGB.rainfalls.rainfall.form.validation;

  return yup.object<Record<keyof RainfallForm, yup.AnySchema>>({
    date: yup.string().required(msgs.dateRequired),
    amount: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(msgs.amountRequired)
      .required(msgs.amountRequired)
      .min(0, msgs.amountRange)
      .max(9999.9, msgs.amountRange),
    areas: yup.array().of(yup.string().required()).min(1, msgs.areasRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const rainfallSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(rainfallSchema(languageGB) as any);

export default rainfallSchemaResolver;
