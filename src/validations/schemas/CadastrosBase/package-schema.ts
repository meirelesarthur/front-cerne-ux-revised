// src/validations/schemas/CadastrosBase/package-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Embalagem (Package) — FUNÇÃO que
// recebe languageGB e devolve o schema (mensagens i18n), mirror mecânico de
// kind-schema.ts/breed-schema.ts.
//
// Localização RATIFICADA pelo Maestro (Package-Frontend-Contrato.md v1.1 §5):
// `src/validations/schemas/CadastrosBase/` (NÃO `pages/`, NÃO
// `schemas/Package/` — pasta inexistente) — espelha `provider-schema.ts`,
// único precedente real de subpasta em `validations/schemas/`.
//
// `measurement_uuid` guarda o Option `{ label, value }` inteiro
// (SelectAsyncPaginate, não uma folha simples) — validado com `.required()`
// (o backend rejeita `null`/ausente com 422, `PackageRequest`: campo
// `required` tanto no create quanto no update, mesmas regras em ambos os
// verbos — Package-contrato.md).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const packageSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.packages.package.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(255, messages.descriptionMaxLength),
    size: yup
      .number()
      .typeError(messages.sizeRequired)
      .required(messages.sizeRequired)
      .min(0.01, messages.sizeMin),
    measurement_uuid: yup.mixed().required(messages.measurementRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const packageSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(packageSchema(languageGB));

export default packageSchemaResolver;
