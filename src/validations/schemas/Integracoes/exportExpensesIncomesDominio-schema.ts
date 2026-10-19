// src/validations/schemas/Integracoes/exportExpensesIncomesDominio-schema.ts
// Schema Yup da tela "Exportação Domínio — Contas a Pagar/Receber" (F-118,
// Integrações, irmã do canário F-119, mirror `exportMovementsDominio-schema.ts`).
// 11 campos: `type` é o ÚNICO obrigatório (`Option<number>` via
// `fieldValidationSchema(...).option()`, `in:1,2` no server); as 4 datas são
// `nullable` + ISO `yyyy-MM-dd`, com 2 `.test` cross-field (`end_date >=
// start_date` e `end_due_date >= start_due_date`, espelhando
// `after_or_equal:*` do server); os 4 selects restantes (`farm`,
// `proprietary_id`, `status`, `center_id`) são `Option | null` nullable; e
// `categories` é `Option[] | null` nullable (multiselect). Mensagens 100%
// derivadas da tradução — nunca string literal (severidade INVIOLÁVEL).
//
// Comparação de strings ISO 'yyyy-MM-dd' é lexicográfica e correta para
// ordenar datas — não precisa parse para `Date` (mesmo racional do canário).

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

// Datas do form são OPCIONAIS (contrato §2.2) — diferente do
// `fieldValidationSchema(...).date()` (sempre `.required`). Mirror do
// `.date()` canônico (mesma regex ISO), só trocando `.required` por
// `.nullable()` puro.
function optionalIsoDate(languageGB: LanguageDate) {
  const messages = languageGB.defaltStrings.validations;
  return yup
    .string()
    .trim()
    .nullable()
    .matches(/^\d{4}-\d{2}-\d{2}$/, {
      message: messages.invalidValue,
      excludeEmptyString: true,
    });
}

// Select OPCIONAL (`Option<T> | null`) — mirror de `fieldValidationSchema(...).option()`
// sem `.required()` (os 4 selects de entidade + status são todos opcionais,
// só `type` é obrigatório).
function optionalOption<T>() {
  return yup
    .object({
      label: yup.string().required(),
      value: yup.mixed<T>().required(),
    })
    .nullable()
    .default(null);
}

export const exportExpensesIncomesDominioSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const vMsg = languageGB.integrations.exportExpensesIncomesDominio.form.validation;

  return yupResolver(
    yup.object({
      farm: optionalOption<string>(),
      start_date: optionalIsoDate(languageGB),
      end_date: optionalIsoDate(languageGB).test(
        'end-after-or-equal-start',
        vMsg.endBeforeStart,
        (value, ctx) => !value || !ctx.parent.start_date || value >= ctx.parent.start_date
      ),
      start_due_date: optionalIsoDate(languageGB),
      end_due_date: optionalIsoDate(languageGB).test(
        'end-due-after-or-equal-start-due',
        vMsg.endDueBeforeStartDue,
        (value, ctx) => !value || !ctx.parent.start_due_date || value >= ctx.parent.start_due_date
      ),
      proprietary_id: optionalOption<string>(),
      status: optionalOption<number>(),
      center_id: optionalOption<string>(),
      // Único campo obrigatório (FLD-09) — `Option<number>` com `.value ∈ {1,2}`.
      type: v.option<number>(),
      categories: yup.array().of(optionalOption<string>()).nullable().default(null),
    })
  );
};
