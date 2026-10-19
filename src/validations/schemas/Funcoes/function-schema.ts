// src/validations/schemas/Funcoes/function-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário "Funções" (Function — Administrativo /
// Gestão Pessoal), espelhando `FunctionRequest::rules()` (`Funcoes-contrato.md`
// §5.2, APROVADO v1.1): `name` obrigatório/`max:120` (SEM unique client-side —
// decisão do dono, DA-FN-11 valida só no backend/índice, aceita duplicidade no
// client), `cbo_uuid` obrigatório (Option{label,value} inteiro guardado pelo
// RHF), `base_salary` obrigatório/`min:0` (decimal puro, DA-FN-07),
// `monthly_hours` obrigatório/inteiro/`min:1` (DA-FN-08 — nunca zero, garante
// divisão do servidor nunca por zero), `is_enabled` booleano, `description`
// obrigatório/`max:191`.
//
// Vive em `src/validations/schemas/Funcoes/` (NÃO em `pages/`) — mandato
// INVIOLÁVEL do task-packet (TASK-FN-FE-02), mesmo path canônico já usado por
// `marker-schema.ts`/`client-schema.ts` — desvio pré-canonização de
// `breed-schema.ts` (`pages/CadastrosBase/Racas/`) NÃO é replicado aqui.
//
// `vl_time_productive` NÃO entra neste schema — não é campo RHF (calculado no
// servidor, DA-FN-08, exibido só via `InputReadOnly`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const functionSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.functions.function.form.validation;

  return yup.object({
    name: v.string().max(120, messages.nameMaxLength),
    cbo_uuid: v.option(),
    base_salary: v.number().min(0, messages.baseSalaryMin),
    monthly_hours: v
      .number()
      .integer(messages.monthlyHoursInteger)
      .min(1, messages.monthlyHoursMin),
    is_enabled: v.boolean(),
    description: v.string().max(191, messages.descriptionMaxLength),
  });
};

export const functionSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(functionSchema(languageGB));

export default functionSchemaResolver;
