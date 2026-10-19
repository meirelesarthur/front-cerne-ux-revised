// src/validations/schemas/Document/document-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do módulo COMPARTILHADO de Documentos Anexos
// (Document) — TASK-FE-036-337. Consumido por `DocumentPanel` (Tarefa 338),
// para os 2 segmentos (`incomes`/`expenses`) — NÃO duplicar em Income/Expense.
//
// Mirror EXATO das regras reais de `UploadIncomeDocumentRequest`/
// `UploadExpenseDocumentRequest` (leitura direta do backend, TASK-036-GB-04),
// SÓ para os campos de texto do formulário:
//   description — required, string, max:50.
//   date        — sometimes, date (opcional — backend usa `now()` como
//                 default quando ausente).
//
// SEM regra Yup para `file` — a validação de tipo (`mimes:pdf`)/tamanho
// (`max:2048` KB = 2MB) é feita pelo próprio `FileUpload`
// (`accept=".pdf"`/`maxSizeMb={2}`, componente já existente,
// `components/Form/FileUpload.tsx`), consumida pela Tarefa 338 via
// `useState<File|null>` — o arquivo NUNCA é campo do `useForm`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const documentSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.document.panel.upload.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(50, messages.descriptionMaxLength),
    // Opcional — mirror `sometimes` do backend (default `now()` no servidor
    // quando ausente). Sem regra de formato adicional além do próprio
    // `DateInput` já entregar `YYYY-MM-DD`/`null`.
    date: yup.string().nullable(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` do `DocumentPanel`
 * (Tarefa 338) — mirror `writeOffSchemaResolver`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const documentSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(documentSchema(languageGB)) as any;

export default documentSchemaResolver;
