// src/validations/schemas/Marcacao/marking-done-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup das linhas de REALIZADO (done) de Marcação — mesma
// estrutura de `marking-forecast-schema.ts`. Fundação TASK-MC-FE-01; UI
// consumidora é TASK-MC-FE-06/07 (onda 2, fora desta Tarefa).
//
// `order` único dentro do array (mirror `MarkingDoneRequest::withValidator()`
// real: sequência 1..N sem lacunas, validada no servidor; aqui só a unicidade
// básica como feedback client-side). `color` NUNCA obrigatório (nullable no
// servidor, `MarkingDoneLineData::$color: string|Optional`).
//
// FIX de homologação (achado do dono, mesmo risco de `marking-schema.ts`/
// `marking-forecast-schema.ts`): campos numéricos usavam `yup.number()` CRU
// (sem `.typeError()`) — trocados por `fieldValidationSchema(languageGB)
// .number()` (`.transform()` converte `''`/`null` em `undefined`, cai no
// `.required()` traduzido; `.typeError(messages.invalidValue)` traduzido
// para qualquer outro valor não-numérico).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const markingDoneLinesSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  const lineSchema = yup.object({
    order: v.number().min(1, messages.invalidValue),
    date: yup.string().trim().required(messages.requiredField),
    quantity: v.number().min(0, messages.invalidValue),
    discard: v.number().min(0, messages.invalidValue),
    average_weight: v.number().min(0, messages.invalidValue),
    average_price: v.number().min(0, messages.invalidValue),
    status: yup.string().required(messages.requiredField),
    color: yup.string().nullable(),
  });

  return yup.object({
    lines: yup
      .array()
      .of(lineSchema)
      .min(1, messages.requiredField)
      .test('unique-order', languageGB.marcacao.marking.done.validation.uniqueOrder, (lines) => {
        if (!lines || lines.length === 0) return true;
        const orders = lines.map((line) => line?.order);
        return new Set(orders).size === orders.length;
      }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — TASK-MC-FE-06/07 (onda 2).
 * Mirror `markingSchemaResolver` (`marking-schema.ts`).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de linhas de realizado.
 */
export const markingDoneLinesSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(markingDoneLinesSchema(languageGB) as any);

export default markingDoneLinesSchema;
