// src/validations/schemas/AnimalMovementAnalysisReport/animal-movement-analysis-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório F-223 Análise Mov. Lote
// (esteira 97-Esteiras/059, CONTRATO-F223-analise-mov-lote.md §5,
// TASK-223-API-01). Mirror de
// `AnimalBatchHistoryReport/animal-batch-history-report-filter-schema.ts`
// (F-221) + teste relacional de
// `BreedingMating/reproductive-history-report-filter-schema.ts` para
// `end_date >= start_date`.
//
// Diverge dos dois irmãos: a API (`AnimalMovementAnalysisReportRequest`)
// exige `end_date` OPCIONAL (`sometimes`) mas, quando presente,
// `after_or_equal:start_date` — diferente de F-221 (sem teste de intervalo,
// porque a API dele não valida isso) e de Histórico Reprodutivo (`end_date`
// SEMPRE obrigatório). Aqui `end_date` continua opcional; só o teste
// relacional é condicional à presença do valor — replicar client-side
// exatamente o que o servidor exige, nem mais nem menos.
//
// SEM `status` (diverge de F-221 — `AnimalMovementAnalysisReportRequest` não
// expõe esse filtro).
//
// Nenhuma string literal em mensagem de validação — `requiredField` vem de
// `languageGB.defaltStrings.validations` (fonte única); o teste relacional
// usa `languageGB.animalMovementAnalysisReport.report.validation.endDateBeforeStart`
// (módulo próprio, mirror `breedingMatings.reproductiveHistoryReport.hint`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { AnimalMovementAnalysisReportOutputType } from '@/@types/v2/AnimalMovementAnalysisReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const animalMovementAnalysisReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;
  const relationalMessage =
    languageGB.animalMovementAnalysisReport.report.validation.endDateBeforeStart;

  return yup.object({
    start_date: yup.string().trim().nullable().default(null),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .default(null)
      .test('end-date-after-start-date', relationalMessage, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
    batch: optionSchema.required(messages.requiredField),
    type: v.option<AnimalMovementAnalysisReportOutputType>(),
  });
};

export const animalMovementAnalysisReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(animalMovementAnalysisReportFilterSchema(languageGB)) as any;

export default animalMovementAnalysisReportFilterSchemaResolver;
