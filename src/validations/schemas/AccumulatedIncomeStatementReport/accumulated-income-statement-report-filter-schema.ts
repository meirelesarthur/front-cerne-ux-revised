// src/validations/schemas/AccumulatedIncomeStatementReport/accumulated-income-statement-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório F-217 Custo de Produção
// Acumulado (esteira 97-Esteiras/058, TASK-058-F217-FE-01). Mirror
// ESTRUTURAL de `advance-report-filter-schema.ts` (par de datas obrigatório,
// `fim >= início` via `.test()`) + a validação ADITIVA exigida por D-058-06:
// o período não pode exceder 12 meses (espelha o 422 do servidor,
// evitando round-trip previsível — plano §2.3).
//
// Nenhuma string literal em mensagem de validação — tudo via
// `languageGB.accumulatedIncomeStatementReport.report.validation.*`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import { differenceInCalendarMonths, parseISO } from 'date-fns';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type {
  AccumulatedIncomeStatementCalculationModule,
  AccumulatedIncomeStatementGroup,
  AccumulatedIncomeStatementReportFormat,
  AccumulatedIncomeStatementType,
} from '@/@types/v2/AccumulatedIncomeStatementReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

/** Limite estrutural do relatório "acumulado" (D-058-06/D-217-A) — mesmo
 *  cálculo do backend (`Service.php:82-94`, claim CL-02 do contrato
 *  legado): a diferença INCLUSIVA de meses entre `start_date`/`end_date`
 *  não pode passar de 12.
 *  @param {string} startDate - início do intervalo (ISO).
 *  @param {string} endDate - fim do intervalo (ISO).
 *  @return {boolean} true quando o intervalo cabe em 12 meses (inclusive). */
function isWithinTwelveMonths(startDate: string, endDate: string): boolean {
  const months = differenceInCalendarMonths(parseISO(endDate), parseISO(startDate)) + 1;
  return months <= 12;
}

export const accumulatedIncomeStatementReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.accumulatedIncomeStatementReport.report.validation;

  return yup.object({
    group: v.option<AccumulatedIncomeStatementGroup>(),
    type: v.option<AccumulatedIncomeStatementType>(),
    start_date: yup.string().trim().nullable().required(messages.invalidDateRange),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.invalidDateRange)
      .test('end-date-after-start-date', messages.invalidDateRange, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        if (!value || !parent.start_date) return true;
        return value >= parent.start_date;
      })
      .test('max-twelve-months', messages.maxTwelveMonths, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        if (!value || !parent.start_date) return true;
        return isWithinTwelveMonths(parent.start_date, value);
      }),
    calculation_module: v.option<AccumulatedIncomeStatementCalculationModule>(),
    farm_id: optionSchema,
    proprietary: optionSchema,
    has_stock: optionSchema,
    harvest: optionSchema,
    cost_center: yup.array(yup.string().required()).default([]),
    format: v.option<AccumulatedIncomeStatementReportFormat>(),
  });
};

export const accumulatedIncomeStatementReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(accumulatedIncomeStatementReportFilterSchema(languageGB)) as any;

export default accumulatedIncomeStatementReportFilterSchemaResolver;
