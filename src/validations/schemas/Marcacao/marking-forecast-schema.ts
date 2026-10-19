// src/validations/schemas/Marcacao/marking-forecast-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup das linhas de PREVISÃO (forecast) de Marcação —
// mirror `appropriation-schema.ts` (linhas via `useFieldArray`). Fundação
// TASK-MC-FE-01; UI consumidora é TASK-MC-FE-05/07 (onda 2, fora desta Tarefa).
//
// A soma de `percentage`==100% e a sequência `order` 1..N sem lacunas são
// validadas pelo SERVIDOR (`MarkingForecastRequest::withValidator()`, real,
// confirmado por leitura direta) — o front replica a soma como validação
// client-side de UX (feedback imediato, mirror `CLM-FORECAST-VALIDATION`),
// nunca como substituto da validação real que já existe na API.
//
// FIX de homologação (achado do dono, mesmo risco de `marking-schema.ts`):
// todos os campos numéricos usavam `yup.number()` CRU
// (`.required(messages.requiredField)`, sem `.typeError()`) — ao esvaziar
// qualquer um, `''` → `NaN` dispararia o typeError PADRÃO do Yup em inglês
// em vez da mensagem traduzida. Trocados por `fieldValidationSchema(
// languageGB).number()` (mesmo helper de `marking-schema.ts`): `.transform()`
// converte `''`/`null` em `undefined` (cai no `.required()` traduzido) +
// `.typeError(messages.invalidValue)` traduzido para qualquer outro valor
// não-numérico.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const markingForecastLinesSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  const lineSchema = yup.object({
    order: v.number().min(1, messages.invalidValue),
    percentage: v.number().min(1, messages.invalidValue).max(100, messages.invalidValue),
    average_weight: v.number().min(0, messages.invalidValue),
    average_price: v.number().min(0, messages.invalidValue),
    days: v.number().min(0, messages.invalidValue),
  });

  return yup.object({
    lines: yup
      .array()
      .of(lineSchema)
      .min(1, messages.requiredField)
      .test(
        'sum-percentage-100',
        languageGB.marcacao.marking.forecast.validation.sumPercentage100,
        (lines) => {
          if (!lines || lines.length === 0) return true;
          const sum = lines.reduce((acc, line) => acc + (line?.percentage ?? 0), 0);
          return sum === 100;
        }
      ),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — TASK-MC-FE-05/07 (onda 2).
 * Mirror `markingSchemaResolver` (`marking-schema.ts`).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de linhas de previsão.
 */
export const markingForecastLinesSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(markingForecastLinesSchema(languageGB) as any);

export default markingForecastLinesSchema;
