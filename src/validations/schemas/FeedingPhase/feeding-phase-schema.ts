// src/validations/schemas/FeedingPhase/feeding-phase-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário completo de Fase de Alimentação
// (FeedingPhase — Operacional/Pecuária/Confinamento, F-034, TASK-FP-FE-01),
// espelhando `FeedingPhaseRequest::rules()` (`feeding-phases-contrato-
// migracao.md` §4, lido diretamente em `GB.Cerne.Api`). Vive em
// `src/validations/schemas/FeedingPhase/` (pasta pelo NOME DA ENTIDADE,
// NUNCA em `src/pages/`).
//
// Campos do cabeçalho — `date`/`name` obrigatórios, `observation` opcional
// (`FeedingPhaseRequest.php`): `date` (required|date), `name`
// (required|string|max:120), `observation` (nullable|string|max:1500).
// `code`/`user_id`/`sequence`/`item_id` NUNCA são campos de formulário —
// nunca aparecem aqui.
//
// Convenção de valor RHF (mirror `diet-schema.ts`): `diet_id`/`change_rule`
// (linha de item) guardam o `Option{label,value}` INTEIRO.
//
// Itens: `.min(1)` (array), cada item `diet_id`/`change_rule` required
// (Option), `minimum_start`/`maximum_end` inteiros `min(1)` — mirror
// `FeedingPhaseRequest::rules()` (`items.*.minimum_start`/`maximum_end`
// `required|integer|min:1`). Comparação `maximum_end >= minimum_start` é
// validada no SERVIDOR (`gte:items.*.minimum_start`); este schema Yup
// replica apenas os limites individuais no SUBMIT. A validação IMEDIATA
// pós-preenchimento (intra-item Mín/Máx + cross-item por `change_rule`,
// AUTORIZADA pelo dono na Esteira 051, fiel ao form legado IG-02/IG-03)
// vive em `feeding-phase-items-validation.ts` (helper puro consumido por
// `FeedingPhaseItemRow.tsx` via `setError`/Toast) — ADICIONAL a este
// schema, nunca o substitui.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const feedingPhaseSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.feedingPhases.feedingPhase.form.validation;

  return yup.object({
    date: yup.string().trim().required(messages.dateRequired),

    name: yup.string().trim().required(messages.nameRequired).max(120, messages.nameMax),

    observation: yup.string().nullable().max(1500, messages.observationMax),

    items: yup
      .array()
      .of(
        yup.object({
          diet_id: optionSchema.test('required', messages.itemDietRequired, (value) => !!value),
          change_rule: optionSchema.test(
            'required',
            messages.itemChangeRuleRequired,
            (value) => !!value
          ),
          minimum_start: yup
            .number()
            .transform((value, original) =>
              original === '' || original === null ? undefined : value
            )
            .typeError(messages.itemMinimumStartMin)
            .required(messages.itemMinimumStartMin)
            .integer(messages.itemMinimumStartMin)
            .min(1, messages.itemMinimumStartMin),
          maximum_end: yup
            .number()
            .transform((value, original) =>
              original === '' || original === null ? undefined : value
            )
            .typeError(messages.itemMaximumEndMin)
            .required(messages.itemMaximumEndMin)
            .integer(messages.itemMaximumEndMin)
            .min(1, messages.itemMaximumEndMin),
        })
      )
      .min(1, messages.itemsMin)
      .required(messages.itemsMin),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const feedingPhaseSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(feedingPhaseSchema(languageGB)) as any;

export default feedingPhaseSchemaResolver;
