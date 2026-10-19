// src/validations/schemas/Sharings/sharing-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário único de Compartilhamento (Sharing —
// Integrações, F-122, TASK-CP-FE-02). Fábrica `(languageGB) => yupResolver(...)`,
// mirror mecânico de `contractSchemaResolver`
// (`src/validations/schemas/Contracts/contract-schema.ts`).
//
// Corrige `DIV-02` do legado (forms não exibiam erro de validação/repopulavam
// o form) — aqui os 422 aparecem por campo automaticamente pelo padrão do
// projeto (`get_spa_api_client_pattern`), este schema só cobre a validação
// CLIENT-SIDE prévia (feedback imediato, sem round-trip ao backend).
//
// `date` (required), `tenant_uuid` (required, `Option`), `items` (array,
// mínimo 1 — o único item possível hoje é `"markings"`, `SharingItem` enum
// do backend). "Responsável" NÃO entra neste schema — nunca é um campo do
// formulário (`CL-016`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

export const sharingSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.sharings.form.validation;

  return yup.object({
    date: yup.string().nullable().required(messages.dateRequired),
    tenant_uuid: yup.mixed<Option<string> | null>().required(messages.tenantRequired),
    items: yup.array().of(yup.string().required()).min(1, messages.itemsRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const sharingSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(sharingSchema(languageGB));

export default sharingSchemaResolver;
