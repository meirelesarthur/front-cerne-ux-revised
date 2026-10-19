// src/validations/schemas/StockAbcReport/stock-abc-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Curva ABC/Estoque" (F-322,
// esteira 97-Esteiras/077). Mirror ESTRUTURAL de
// `stock-provider-lot-report-filter-schema.ts`, mas `start_date`/`end_date`
// usam `fieldValidationSchema(languageGB).date()` (REQUIRED por padrão,
// string ISO 'yyyy-MM-dd', NUNCA `yup.date()` — ver nota de produção no
// próprio helper `field-validation-schema.ts`), diferente do mirror visual
// `StockProviderLotReport` (datas decorativas/`nullable()`). Fidelidade ao
// legado: `00-CONSOLIDADO.md` item 2, checklist item 5.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { StockAbcReportFormat } from '@/@types/v2/StockAbcReport';

export const stockAbcReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.stockAbcReport.report;

  return yup.object({
    start_date: v.date(),
    end_date: v
      .date()
      .test(
        'end-date-after-start-date',
        messages.validation.endDateBeforeStartDate,
        (value, context) => {
          const parent = context.parent as { start_date?: string | null };
          const startDate = parent.start_date;
          if (!value || !startDate) return true; // ambas required — guarda contra estado transitório
          return value >= startDate;
        }
      ),
    format: v.option<StockAbcReportFormat>(),
  });
};

export const stockAbcReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(stockAbcReportFilterSchema(languageGB)) as any;

export default stockAbcReportFilterSchemaResolver;
