// src/validations/schemas/MovementPurchases/movement-purchase-document-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do modal de Documentos de Compra de Animais
// (TASK-CP-08). Mirror mecânico de `movement-sale-document-schema.ts`
// (`equipment-schema.ts` → `attachments[]`): `description` obrigatória com
// `max`, `file` FORA do Yup (é `File | null` de controle de UI — validado no
// handler do submit, já que `required` depende de `old_document_uuid` estar
// ausente, e o tipo/tamanho já é barrado ANTES pelo próprio `FileUpload`
// client-side), `date`/`old_document_uuid` sem regra (controle interno, nunca
// digitados livremente pelo usuário).
//
// O shape de TELA (`documents: MovementPurchaseDocumentRow[]`) é o mesmo de
// Vendas — só o WIRE FORMAT enviado ao servidor diverge (arrays paralelos por
// índice, ver `movement-purchase-service.ts::buildMovementPurchaseDocumentsFormData`),
// o que não afeta este schema (valida a FORMA da tela, não o payload de fio).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const movementPurchaseDocumentSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.movementPurchases.movementPurchase.documents.validation;

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
    // `FileUpload`, mesmo racional de `movement-sale-document-schema.ts`.
    file: yup.mixed().nullable(),
  });

  return yup.object({
    documents: yup.array().of(documentRowSchema).default([]),
  });
};

export const movementPurchaseDocumentSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(movementPurchaseDocumentSchema(languageGB));

export default movementPurchaseDocumentSchemaResolver;
