// src/validations/schemas/MovementSales/movement-sale-document-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do modal de Documentos de Venda de Animais (Tarefa
// 17.b, task-packet 17 §1.2). Mirror mecânico de `equipment-schema.ts`
// (`attachments[]`): `description` obrigatória com `max`, `file` FORA do Yup
// (é `File | null` de controle de UI — validado no handler do submit, já que
// `required` depende de `old_document_uuid` estar ausente, e o tipo/tamanho
// já é barrado ANTES pelo próprio `FileUpload` client-side), `date`/
// `old_document_uuid` sem regra (controle interno, nunca digitados
// livremente pelo usuário).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const movementSaleDocumentSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.movementSales.movementSale.documents.validation;

  const documentRowSchema = yup.object({
    old_document_uuid: yup.string().nullable(),
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(50, messages.descriptionMaxLength),
    date: yup.string().nullable(),
    // Fora do Yup — `required` condicional (`!old_document_uuid`) e
    // tipo/tamanho (`mimes:pdf`, `max:2048`) validados no handler/
    // `FileUpload`, mesmo racional de `equipment-schema.ts` (`attachments[].file`).
    file: yup.mixed().nullable(),
  });

  return yup.object({
    documents: yup.array().of(documentRowSchema).default([]),
  });
};

export const movementSaleDocumentSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(movementSaleDocumentSchema(languageGB));

export default movementSaleDocumentSchemaResolver;
