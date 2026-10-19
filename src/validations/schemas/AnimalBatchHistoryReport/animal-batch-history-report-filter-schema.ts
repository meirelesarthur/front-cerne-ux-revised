// src/validations/schemas/AnimalBatchHistoryReport/animal-batch-history-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório F-221 Histórico de
// Animais/Lote (esteira 97-Esteiras/058, TASK-058-F221-FE-01). Mirror de
// `pag-prev-real-report-filter-schema.ts`/`advance-report-filter-schema.ts` —
// SEM `columns` (este relatório não tem colunas configuráveis, plano §2.5).
//
// Diverge do par de datas dos irmãos Financeiro: `end_date` NÃO é
// `.required()` e NÃO tem `.test()` de intervalo — o legado não valida
// `end>=start` para este relatório e a API (`AnimalBatchHistoryReportRequest`)
// só exige `after_or_equal` quando `end_date` está presente; replicar client-
// side um required/teste mais estrito rejeitaria algo que o servidor aceita
// (plano §2.5, decisão default).
//
// Nenhuma string literal em mensagem de validação — tudo via
// `languageGB.defaltStrings.validations.*` (fieldValidationSchema) ou
// `languageGB.animalBatchHistoryReport.report.validation.*`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { AnimalBatchHistoryReportOutputType } from '@/@types/v2/AnimalBatchHistoryReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const animalBatchHistoryReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.defaltStrings.validations;

  return yup.object({
    start_date: yup.string().trim().nullable().default(null).required(messages.requiredField),
    end_date: yup.string().trim().nullable().default(null),
    batch: optionSchema.required(messages.requiredField),
    status: optionSchema,
    type: v.option<AnimalBatchHistoryReportOutputType>(),
  });
};

export const animalBatchHistoryReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(animalBatchHistoryReportFilterSchema(languageGB)) as any;

export default animalBatchHistoryReportFilterSchemaResolver;
