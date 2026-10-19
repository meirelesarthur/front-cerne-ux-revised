// src/validations/schemas/FeedlotYards/feedlotYard-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Pátio (FeedlotYard) — TASK-PT-FE-02.
// Mirror 1:1 das regras reais do backend (`FeedlotYardRequest::rules()`):
// `name` (string, required, max:120), `width`/`length` (numeric, required,
// min:0), `is_active` (boolean, required), `observation` (string, nullable,
// max:600). `code`/`area`/`priority` são SÓ-LEITURA — fora deste schema.
//
// Mensagens via `languageGB.feedlotYards.feedlotYard.form.validation.*`
// (bloco PRÓPRIO do módulo, não `defaltStrings.validations` genérico) —
// mesma convenção já usada por `centro-custo-schema.ts`/`pasture-schema.ts`
// para mensagens de campo específicas do domínio. `width`/`length` usam
// `.min(0, ...)` (o backend aceita zero) — por isso não reaproveitam
// `fieldValidationSchema().number()` (cujo `.test("is-valid-number", ...,
// v => v! > 0)` rejeitaria zero), mesmo racional documentado em
// `pasture-schema.ts` (`optionalNumberMin0`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { FeedlotYardForm } from '@/@types/v2/FeedlotYards';

export const feedlotYardSchema = (languageGB: LanguageDate) => {
  const msgs = languageGB.feedlotYards.feedlotYard.form.validation;

  return yup.object<Record<keyof FeedlotYardForm, yup.AnySchema>>({
    name: yup.string().trim().required(msgs.nameRequired).max(120, msgs.nameMaxLength),
    width: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(msgs.widthRequired)
      .required(msgs.widthRequired)
      .min(0, msgs.widthMin),
    length: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(msgs.lengthRequired)
      .required(msgs.lengthRequired)
      .min(0, msgs.lengthMin),
    is_active: yup.object().nullable().required(msgs.isActiveRequired),
    observation: yup.string().nullable().max(600, msgs.observationMaxLength),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const feedlotYardSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(feedlotYardSchema(languageGB) as any);

export default feedlotYardSchemaResolver;
