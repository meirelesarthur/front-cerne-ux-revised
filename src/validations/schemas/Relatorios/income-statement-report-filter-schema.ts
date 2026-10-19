// src/validations/schemas/Relatorios/income-statement-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Custo de Produção" (F-272,
// esteira 97-Esteiras/073, TASK-272-FE-01). Mirror ESTRUTURAL de
// `cost-calculation-report-filter-schema.ts`, mas com 5 campos OBRIGATÓRIOS
// (não só o par de datas — `group`/`type`/`calculation_module` também são
// `required` na API, `HasIncomeStatementFilterRules.php:26-30`) e SEM default
// pré-selecionado (contrato de tela §2, risco #5 — nenhum dos 3 selects tem
// "nenhum" como valor legítimo do enum, então o Yup exige que o usuário
// escolha, diferente da tela DRE que pré-seleciona "Sintético").
//
// Valida a FORMA INTERNA do form (Option-based, react-select), NÃO o payload
// final do service (`IncomeStatementFilterParams`) — a extração `.value`
// acontece em `buildParams` da página (TASK-272-FE-02), nunca aqui.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);
const optionListSchema = yup.array().of(optionSchema).nullable().default(null);

export const incomeStatementReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.incomeStatementReport.report;

  return yup.object({
    group: optionSchema.required(messages.validation.groupRequired),
    type: optionSchema.required(messages.validation.typeRequired),
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
      .test('end-date-after-start-date', messages.validation.periodRequired, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        if (!value || !parent.start_date) return true;
        return value >= parent.start_date;
      }),
    calculation_module: optionSchema.required(messages.validation.calculationModuleRequired),
    farm_id: optionSchema,
    proprietary_id: optionSchema,
    has_stock: optionSchema,
    harvest_id: optionSchema,
    cost_center_ids: optionListSchema,
  });
};

export const incomeStatementReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(incomeStatementReportFilterSchema(languageGB)) as any;

export default incomeStatementReportFilterSchemaResolver;
