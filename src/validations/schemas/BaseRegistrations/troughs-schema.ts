// src/validations/schemas/BaseRegistrations/troughs-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Cochos (Trough) — padrão da
// empresa: FUNÇÃO que recebe `languageGB` e devolve o schema (mensagens
// i18n). Mirror mecânico de `grazings-schema.ts`.
//
// `code` NÃO entra neste schema — gerado no servidor, nunca submetido.
// `area_uuid`/`grazing_uuid`/`feedlot_corral_uuid` são todos OPCIONAIS aqui —
// a exclusividade Área×Módulo Pastejo (D1 do contrato de API) é reforçada no
// COMPONENTE via `watch`/`setValue`/`isDisabled` (contrato de tela §3.1), não
// neste schema (Yup não modela bem "campo A XOR campo B" sem acoplar as 2
// chaves a um único teste cruzado, e o componente já impede o estado
// inválido antes mesmo de validar).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { GUID_REGEX } from '@/utils/guid';

import { TROUGH_TYPE_VALUES } from '@/constants/Trough/options/trough-type-options';

import type { LanguageDate } from '@/@types/language';

export const troughSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.trough.form.validation;

  return yup.object({
    type: yup
      .string()
      .oneOf([...TROUGH_TYPE_VALUES], messages.typeRequired)
      .required(messages.typeRequired),
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    total_area: yup
      .number()
      .typeError(messages.totalAreaRequired)
      .min(0, messages.totalAreaMin)
      .required(messages.totalAreaRequired),
    area_uuid: yup.string().matches(GUID_REGEX, { excludeEmptyString: true }).nullable(),
    grazing_uuid: yup.string().matches(GUID_REGEX, { excludeEmptyString: true }).nullable(),
    feedlot_corral_uuid: yup.string().matches(GUID_REGEX, { excludeEmptyString: true }).nullable(),
    is_enabled: yup.boolean().required(messages.activeRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const troughSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(troughSchema(languageGB));

export default troughSchemaResolver;
