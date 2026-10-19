// src/validations/schemas/Relatorios/profitability-by-crop-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Rentabilidade/Cultura"
// (F-302, esteira 077, F-302-plano-front.md §"Riscos", item 2).
//
// `cultivation_uuid` é REQUIRED — `v.option<string>()` de
// `fieldValidationSchema` (mirror `format` de
// `machines-supply-report-filter-schema.ts`), NÃO
// `optionSchema.nullable().default(null)` (esse é para campo OPCIONAL, como
// `harvest` abaixo). Divergência do template F-230/F-313, onde nenhum campo
// de lookup é obrigatório.
//
// `harvest` é OPCIONAL, 100% client-side (nunca vira parâmetro do payload real
// — ver `profitability-by-crop-report.ts`).
//
// `start_date`/`end_date` REQUIRED via `v.date()` (`fieldValidationSchema`) +
// `.test('end-date-after-start-date', ...)` mirror EXATO `ProducaoCusteioArea`/
// `ClienteProduto`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

const harvestOptionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const profitabilityByCropReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.profitabilityByCropReport.report;

  return yup.object({
    cultivation_uuid: v.option<string>(),
    harvest: harvestOptionSchema,
    start_date: v.date(),
    end_date: v
      .date()
      .test(
        'end-date-after-start-date',
        messages.validation.endDateAfterStartDate,
        (value, context) => {
          const startDate = (context.parent as { start_date?: string | null }).start_date;
          if (!value || !startDate) return true;
          return value >= startDate;
        }
      ),
  });
};

export const profitabilityByCropReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(profitabilityByCropReportFilterSchema(languageGB)) as any;

export default profitabilityByCropReportFilterSchemaResolver;
