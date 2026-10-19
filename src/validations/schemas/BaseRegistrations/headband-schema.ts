// src/validations/schemas/BaseRegistrations/headband-schema.ts
// Schema de validação Yup do formulário de Testeiras (Headband). Fábrica que
// recebe `languageGB` e devolve o schema — mirror `diagnosisPregnancy-schema.ts`.
//
// `position`/`type` obrigatórios (mirror `HeadbandRequest::rules()`); `link`
// como `string` simples (o backend valida `max:200`, não valida formato de
// URL — não inventar regra de URL que o backend não tem). `partner_uuid`
// (vínculo único com Afiliado) e `partner_uuids` (pivot) são NULLABLE no
// backend (`HeadbandRequest`) e não entram aqui — sem regra de obrigatoriedade
// a validar.

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const headbandSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.baseRegistrations.headband.form.validation;

  return yup.object({
    description: v
      .string()
      .required(messages.descriptionRequired)
      .max(40, messages.descriptionMaxLength),
    link: v.string().required(messages.linkRequired).max(200, messages.linkMaxLength),
    position: v
      .number()
      .typeError(messages.positionRequired)
      .required(messages.positionRequired)
      .min(1, messages.positionMin)
      .max(127, messages.positionMax),
    type: v.string().required(messages.typeRequired).nullable(),
  });
};

export const headbandSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(headbandSchema(languageGB));

export default headbandSchemaResolver;
