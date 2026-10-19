// src/validations/schemas/BaseRegistrations/grazings-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Pastejo (Grazing) — mirror
// mecânico de `accountingGroupers-schema.ts` (2 selects de FK) +
// `identificationTypes-schema.ts` (campos simples). FUNÇÃO que recebe
// `languageGB` e devolve o schema (mensagens i18n).
//
// Consumido de fato só por `TASK-GZ-FE-02` (campos base) e `TASK-GZ-FE-03`
// (mapa, campo `areas`) — criado aqui por ser fundação compartilhada
// (TASK-GZ-FE-01). `code` NÃO entra neste schema — gerado no servidor, nunca
// submetido (mesmo racional de `parent_uuid` em `accountingGroupers-schema.ts`
// para campos server-gerados).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { GUID_REGEX } from '@/utils/guid';

import { GRAZING_COLOR_VALUES } from '@/constants/Grazing/options/grazing-color-options';

import type { LanguageDate } from '@/@types/language';

export const grazingSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.baseRegistrations.grazing.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    fodder_uuid: yup
      .string()
      .required(messages.fodderRequired)
      .matches(GUID_REGEX, { excludeEmptyString: true }),
    date: yup.string().required(messages.dateRequired),
    // TASK-GZ-FE-02 (correção de rota, ver `grazing-color-options.ts`
    // cabeçalho): validação alinhada a `GrazingRequest::color`
    // (`Rule::enum(AreaColor::class)`, backend) — paleta FECHADA de 14
    // cores, não mais só formato hex (`colorFormat` é a mesma chave i18n
    // já existente, reaproveitada com o texto atualizado).
    color: yup
      .string()
      .oneOf([...GRAZING_COLOR_VALUES], messages.colorFormat)
      .required(messages.colorRequired),
    control_productivity: yup.boolean().required(),
    areas: yup
      .array()
      .of(yup.string().matches(GUID_REGEX, { excludeEmptyString: true }))
      .min(1, messages.areasMin)
      .required(messages.areasRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const grazingSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(grazingSchema(languageGB));

export default grazingSchemaResolver;
