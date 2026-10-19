// src/pages/CadastrosBase/Vacinas/vaccine-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Vacina — mirror de
// Racas/breed-schema.ts MENOS o `.required()` de `specie_uuid` (D2 do
// contrato backend — `specie_uuid` é SEMPRE `nullable`, nunca obrigatório).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const vaccineSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.vaccines.vaccine.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    is_enabled: yup.boolean().required(),
    // SEM .required() — D2, specie_uuid é OPCIONAL (diverge de breed-schema.ts).
    specie_uuid: yup.mixed().nullable(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const vaccineSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(vaccineSchema(languageGB));

export default vaccineSchemaResolver;
