// src/validations/schemas/ChargeBillIncome/charge-bill-income-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup do formulário de Contas a Receber (ChargeBillIncome — Operacional
// / Agricultura / Carregamento). TASK-CBI-FE-03, esteira 97-Esteiras/059.
// Espelha o contrato de tela §3 (FLD-01..08, fiel a `_forms.blade.php`):
// `dt_emission`/`due_date`/`amount`/`description` obrigatórios; `number`
// opcional (max 15, FLD-04); `provider_uuid`/`cultivation_uuid` nullable/
// clearable (FLD-06/07). `code` NÃO é validado (readonly/server-authoritative,
// DEC-FE-03) — nem entra no payload de escrita (RN-04/RN-05 do contrato legado).
//
// Mirror estrutural de `Carregamentos/charge-schema.ts` (mesmo helper
// `fieldValidationSchema`/`optionOrNull`), sem repetir mensagens novas — só
// reusa `languageGB.defaltStrings.validations.*` já centralizado.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const chargeBillIncomeSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  const optionOrNull = () =>
    yup.object({ label: yup.string(), value: yup.mixed() }).nullable().default(null);

  return yup.object({
    // Readonly/view — server-authoritative (DEC-FE-03); sem regra de
    // validação (mirror RN-04/RN-05: o legado também não valida este campo).
    code: yup.string().trim().default(''),
    // FLD-02/03 — obrigatórios, ISO 'yyyy-MM-dd' (DEF-03, corrige drift de
    // formato do legado).
    dt_emission: v.date(),
    due_date: v.date(),
    // FLD-04 — opcional, max 15 (fiel ao `maxlength=15` do legado).
    number: yup.string().trim().max(15, messages.invalidValue).default(''),
    // FLD-05 — obrigatório, numérico puro, min 0 (RN-03: allowZero=true).
    amount: v.number().min(0, messages.invalidValue),
    // FLD-06/07 — nullable/clearable (fallback "Todos Associados"/"Todos").
    provider_uuid: optionOrNull(),
    cultivation_uuid: optionOrNull(),
    // FLD-08 — obrigatório.
    description: v.string(),
  });
};

export const chargeBillIncomeSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(chargeBillIncomeSchema(languageGB));
