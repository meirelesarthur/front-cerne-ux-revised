// src/validations/schemas/Carregamentos/charge-document-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do modal de Documentos (anexos PDF) de
// Carregamento, TASK-FE-CG-06 — mirror mecânico de
// `MovementSales/movement-sale-document-schema.ts`: `description`
// obrigatória com `max`, `file` FORA do Yup (é `File | null` de controle de
// UI — `required` depende de `document_uuid` estar ausente, e o tipo/
// tamanho já é barrado ANTES pelo próprio `FileUpload` client-side),
// `date`/`document_uuid` sem regra (controle interno, nunca digitados
// livremente pelo usuário).
//
// Arquivo aditivo além do literal "Arquivos Afetados" da ficha da Tarefa —
// necessário pela invariante de estrutura MODULAR (validação nunca inline
// no componente), mesmo padrão do mirror `movement-sale-document-schema.ts`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const chargeDocumentSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.carregamentos.charge.documents.validation;

  const documentRowSchema = yup.object({
    document_uuid: yup.string().nullable(),
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(50, messages.descriptionMaxLength),
    date: yup.string().nullable(),
    // Fora do Yup — `required` condicional (`!document_uuid`) e tipo/tamanho
    // (`mimes:pdf`, `max:2048`) validados no handler/`FileUpload`, mesmo
    // racional de `movement-sale-document-schema.ts`.
    file: yup.mixed().nullable(),
  });

  return yup.object({
    documents: yup.array().of(documentRowSchema).default([]),
  });
};

export const chargeDocumentSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(chargeDocumentSchema(languageGB));

export default chargeDocumentSchemaResolver;
