// src/validations/schemas/Configuracoes/app-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Aplicativos" (App — TASK-APP-FE-01).
// Vive em `src/validations/schemas/` (NUNCA em `pages/`) — mirror estrutural
// de `help-schema.ts`/`animal-schema.ts` (fábrica que recebe `languageGB` e
// devolve o schema).
//
// Mensagens SEMPRE derivadas de `fieldValidationSchema(languageGB)` (fonte
// única de `languageGB.defaltStrings.validations.*`) — instrução explícita
// do task-packet desta Tarefa. NUNCA string literal.
//
// `platform`/`version`: obrigatórios, texto livre (SEM enum — DA-APP-02),
// máx. 10 chars (App-contrato.md Seção 1, `AppRequest::rules()` →
// `['required','string','max:10']`). SEM validação de unicidade
// (DA-APP-03) — dois registros idênticos são válidos, fidelidade ao legado.
// `description`: obrigatória, texto livre, sem `max` (mirror `AppRequest`).
// `release_date`/`deadline`: obrigatórias, formato `Y-m-d` puro — via
// `fv.date()` (`field-validation-schema.ts`), que devolve string validada por
// `/^\d{4}-\d{2}-\d{2}$/` (NÃO `yup.date()`, que castaria para objeto `Date`
// e quebraria o `<input type="date">` controlado — mesmo racional já
// catalogado em `animal-schema.ts`/`entry_date`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const appSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  return yup.object({
    platform: fv.string().max(10, messages.invalidValue),
    version: fv.string().max(10, messages.invalidValue),
    description: fv.string(),
    release_date: fv.date(),
    deadline: fv.date(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const appSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(appSchema(languageGB) as any);

export default appSchemaResolver;
