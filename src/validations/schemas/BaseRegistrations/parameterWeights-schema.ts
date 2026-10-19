// src/validations/schemas/BaseRegistrations/parameterWeights-schema.ts
// Schema de validação Yup do formulário de Parâmetros / Peso. Fábrica que
// compõe `fieldValidationSchema(languageGB)`, mesma convenção de
// `diagnosisPregnancy-schema.ts`. Mirror client-side do
// `ParameterWeightRequest` real (api_root):
//   date: required|date_format:Y-m-d|after_or_equal:1900-01-01|before_or_equal:2100-12-31  (G1)
//   initial_weight: required|numeric|min:0
//   final_weight: required|numeric|min:0|gt:initial_weight                                 (G2)
//   description: required|string|max:40
// `code`/`employee_uuid` propositalmente ausentes — fora do contrato de
// escrita (ver "Leitura do dev" da Tarefa, contrato de API v1.3, G3).

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const parameterWeightsSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.baseRegistrations.parameterWeight.form.validation;

  return yup.object({
    // `v.date()` devolve string ISO 'yyyy-MM-dd' (NÃO `yup.date()` — ver
    // cabeçalho de `field-validation-schema.ts`, TASK-FE-917/fix pós-merge
    // develop 2026-08). `.min()`/`.max()` de `yup.string()` comparam
    // comprimento, não data — o range G1 (1900-01-01..2100-12-31) precisa de
    // `.test()` comparando as strings ISO lexicograficamente (equivalente à
    // comparação de `Date` para o formato zero-padded 'yyyy-MM-dd').
    date: v
      .date()
      .typeError(messages.dateInvalid)
      .required(messages.dateRequired)
      .test('date-min', messages.dateOutOfRange, (value) => !value || value >= '1900-01-01')
      .test('date-max', messages.dateOutOfRange, (value) => !value || value <= '2100-12-31'),
    initial_weight: v
      .number()
      .typeError(messages.weightInvalid)
      .required(messages.weightRequired)
      .min(0, messages.weightMin),
    final_weight: v
      .number()
      .typeError(messages.weightInvalid)
      .required(messages.weightRequired)
      .min(0, messages.weightMin)
      // Arrow function (não `function`) + acesso via colchetes ao `context.parent`
      // — mesma regra cross-field do Roteiro (`final_weight > initial_weight`,
      // G2), adaptada para não disparar `no-invalid-this`/`camelcase` do
      // eslint do projeto (identificador snake_case só existe como chave de
      // objeto aqui, não como binding declarado).
      .test('gt-initial-weight', messages.finalWeightMustBeGreater, (value, context) => {
        const initialWeight = context.parent['initial_weight'];
        if (value == null || initialWeight == null) return true; // deixa o required/typeError tratar
        return value > initialWeight;
      }),
    description: v
      .string()
      .required(messages.descriptionRequired)
      .max(40, messages.descriptionMaxLength),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const parameterWeightsSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(parameterWeightsSchema(languageGB));

export default parameterWeightsSchemaResolver;
