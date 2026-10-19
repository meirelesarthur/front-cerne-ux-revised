// src/validations/schemas/Separations/separation-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de APARTAÇÃO (Separation — Operacional
// > Pecuária, TASK-APART-FE-02, frontend-contract-apartacao.md §7),
// espelhando `SeparationRequest::rules()` (api-contract-apartacao.md §6):
// `date` (required|date), `batches` (required|array|min:1).
//
// Vive em `src/validations/schemas/` (NUNCA em `pages/`, mirror EXATO de
// `batch-schema.ts`/`bull-seed-season-schema.ts`). Mensagens SEMPRE derivadas
// da tradução do módulo (`languageGB.separations.separation.form.validation`)
// — nunca string literal.
//
// `code`/`employee_id`/`user_id`/`farm_id` FORA deste schema, de propósito —
// nunca campos do cliente (contrato §7.1/§7.2, `GAP-APART-01`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const separationSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.separations.separation.form.validation;

  return yup.object({
    // `date` — valor `string` ISO `YYYY-MM-DD` (`DateInput`), não um objeto
    // `Date` — `yup.mixed()` mirror `batchSchema`/`bullSeedSeasonSchema`.
    date: yup.mixed().required(messages.dateRequired),
    // `required|array|min:1` (contrato §7.1/§7.2) — array de `Option<string>`
    // do multi-select de Lotes (`SelectAsyncPaginate isMulti`).
    batches: yup.array().required(messages.batchesRequired).min(1, messages.batchesMin),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const separationSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(separationSchema(languageGB));

export default separationSchemaResolver;
