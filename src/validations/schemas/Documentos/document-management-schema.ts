// src/validations/schemas/Documentos/document-management-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Documentos (DocumentManagement,
// Tarefa 13) — mirror mecânico de `equipment-schema.ts` (bloco `attachments`)
// + regras do `DocumentManagementRequest` do contrato de API §3.4.
//
// `document_type_uuid`: obrigatório (`Option`, `v.option<string>()`).
// `description`: obrigatório, trim, max(100).
// `validity`: opcional, data (string ISO `yyyy-MM-dd` ou `null`).
// `alert_days`: opcional, inteiro, min(0).
// `observation`: opcional, max(200).
// `attachments[].name`: SEM `.required()` — mirror `equipment-schema.ts`
//   (Doc Bruta/UX: default `'Não Informado'` aplicado no COMPONENTE/submit se
//   vazio, mirror `EquipamentoAnexosTab`/`DocumentoAnexosSection` — NÃO
//   travar o submit por nome vazio), só `max(255)`.
// `attachments[].uuid`/`file` fora do Yup (controle/`File`).
//
// `code` NÃO entra neste schema — gerado no servidor, nunca submetido pelo cliente.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const documentManagementSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.baseRegistrations.documentManagements.form.validation;

  const attachmentRowSchema = yup.object({
    uuid: yup.string().nullable(),
    name: yup.string().trim().nullable().max(255, messages.attachmentNameMaxLength),
    file: yup.mixed().nullable(),
  });

  return yup.object({
    document_type_uuid: v.option<string>().required(messages.documentTypeRequired),

    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),

    validity: yup.string().trim().nullable(),

    alert_days: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .nullable()
      .integer()
      .min(0),

    observation: yup.string().trim().nullable().max(200, messages.observationMaxLength),

    attachments: yup.array().of(attachmentRowSchema).default([]),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const documentManagementSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(documentManagementSchema(languageGB));

export default documentManagementSchemaResolver;
