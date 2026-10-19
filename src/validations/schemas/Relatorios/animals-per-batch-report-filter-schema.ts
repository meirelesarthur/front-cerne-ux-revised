// src/validations/schemas/Relatorios/animals-per-batch-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Animais por Lote" (Tarefa
// 51, esteira CORE_WORKSPACE/97-Esteiras/015). Mirror ESTRUTURAL de
// `accumulated-weighing-batch-report-filter-schema.ts` (Tarefa 49) para o
// `optionSchema` local e `format` via
// `fieldValidationSchema(languageGB).option<ReportFormat>()` (sempre valor
// default `pdf` pré-selecionado, `noClearable` no Select).
//
// `batch_id`/`view_type` são OBRIGATÓRIOS (contrato de tela §6); `animal_id`
// é OPCIONAL, SEM `.test()` condicional entre eles — a única "cascata"
// observável é UX (limpar `animal_id` ao trocar Lote/agregado), não uma
// regra de validação cruzada Yup (contrato de tela §6).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`AnimalsPerBatchReportParams`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { ReportFormat } from '@/@types/v2/AccountsReports';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const animalsPerBatchReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.animalsPerBatchReport.report;

  return yup.object({
    batch_id: optionSchema.required(messages.validation.batchRequired),
    view_type: optionSchema.required(messages.validation.viewTypeRequired),
    animal_id: optionSchema,
    format: v.option<ReportFormat>(),
  });
};

export const animalsPerBatchReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(animalsPerBatchReportFilterSchema(languageGB)) as any;

export default animalsPerBatchReportFilterSchemaResolver;
