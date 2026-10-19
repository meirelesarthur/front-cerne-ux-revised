// src/validations/schemas/BaseRegistrations/parameter-schema.ts
// Schema de validação Yup do formulário de Parâmetros (Parameter) — execução
// 031, TASK-FE-031-40. Fábrica que recebe `languageGB` e devolve o schema —
// mirror `headband-schema.ts`.
//
// `name`: required, max(20) — mirror contrato de API §6 (limite real que
// governa a UI, `_forms.blade.php:5`, `maxlength=20`; harmoniza a
// contradição do legado entre `max:6`/`max:8`). A imutabilidade do campo
// quando `is_reserved` é responsabilidade da TELA (TASK-FE-031-42) — este
// schema NÃO conhece a lista de nomes reservados, permanece válido em
// qualquer modo.
// `value`: required, max(255) — coluna real `string` sem limite curto.
// `type`: required, `oneOf([1, 2, 3])` — enum fechado (contrato §4).
// `description`: opcional, max(40) — teto físico real da coluna `string(40)`.

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const parameterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.parameters.parameter.form.validation;

  return yup.object({
    name: v.string().max(20, messages.nameMaxLength),
    value: v.string().max(255, messages.valueMaxLength),
    type: yup
      .number()
      .typeError(messages.typeRequired)
      .required(messages.typeRequired)
      .oneOf([1, 2, 3], messages.typeRequired),
    description: yup.string().trim().max(40, messages.descriptionMaxLength).nullable(),
  });
};

export const parameterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(parameterSchema(languageGB));

export default parameterSchemaResolver;
