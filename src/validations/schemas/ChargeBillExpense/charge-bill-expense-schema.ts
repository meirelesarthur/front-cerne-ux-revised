// src/validations/schemas/ChargeBillExpense/charge-bill-expense-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup do formulário de Contas a Pagar (ChargeBillExpense — Operacional
// / Agricultura / Carregamento). TASK-CBE-04, esteira 97-Esteiras/062.
// Espelha o contrato de tela §2.2 (FLD-01..09): `dt_emission`/`due_date`/
// `amount`/`description` obrigatórios; `number` opcional (max 15, FLD-04);
// `provider_uuid`/`branch_uuid`/`cultivation_uuid` nullable/clearable
// (FLD-06/07/08 — `branch_uuid` sem regra de pertencimento ao provider,
// PERGUNTA-01 resolvida). `code` NÃO é validado (readonly/server-authoritative,
// RN-04/RN-05) — nem entra no payload de escrita.
//
// Mirror EXATO de `validations/schemas/ChargeBillIncome/
// charge-bill-income-schema.ts` (gêmeo), + `branch_uuid` via `optionOrNull()`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const chargeBillExpenseSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  const optionOrNull = () =>
    yup.object({ label: yup.string(), value: yup.mixed() }).nullable().default(null);

  return yup.object({
    // Readonly/view — server-authoritative (RN-04/RN-05); sem regra de
    // validação (mirror do gêmeo: o legado também não valida este campo).
    code: yup.string().trim().default(''),
    // FLD-02/03 — obrigatórios, ISO 'yyyy-MM-dd'.
    dt_emission: v.date(),
    due_date: v.date(),
    // FLD-04 — opcional, max 15 (fiel ao `maxlength=15` do legado).
    number: yup.string().trim().max(15, messages.invalidValue).default(''),
    // FLD-05 — obrigatório, numérico puro, min 0 (RN-03: allowZero=true).
    amount: v.number().min(0, messages.invalidValue),
    // FLD-06/08 — nullable/clearable (fallback "Todos Associados"/"Todos").
    provider_uuid: optionOrNull(),
    cultivation_uuid: optionOrNull(),
    // FLD-07 — EXCLUSIVO desta feature. Nullable, SEM `.required()` e SEM
    // regra de pertencimento ao provider (PERGUNTA-01 resolvida na API —
    // fiel; o FE só desabilita o select via UX, não via validação).
    branch_uuid: optionOrNull(),
    // FLD-09 — obrigatório.
    description: v.string(),
  });
};

export const chargeBillExpenseSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(chargeBillExpenseSchema(languageGB));
