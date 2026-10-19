// src/validations/schemas/Relatorios/paid-interest-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Juros Pagos" (F-290,
// TASK-290-FE-01, esteira 073). Mirror ESTRUTURAL de
// `src/validations/schemas/Dre/dre-report-filter-schema.ts` (par `start_date`/
// `end_date` SEMPRE obrigatório, `end_date >= start_date` via `.test()`).
//
// `provider_uuids`, `proprietary_uuid`, `farm_uuid` são OPCIONAIS, SEM
// `.test()` de proibição condicional entre si — nenhum campo desta tela
// restringe outro (contrato de tela §3, `CLM-025`/`CLM-026`, nenhuma
// cascata/condicional no legado).
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO o
// payload final do service (`PaidInterestReportParams`) — mirror
// `optionSchema` de `dre-report-filter-schema.ts`, com a variante em array
// para o único campo multiselect (`provider_uuids`):
//   provider_uuids: Option<string>[] | null
//   proprietary_uuid: Option<string> | null
//   start_date: string | null
//   end_date: string | null
//   farm_uuid: Option<string> | null
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

const optionListSchema = yup.array().of(optionSchema).nullable().default(null);

export const paidInterestReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.paidInterestReport.report;

  return yup.object({
    provider_uuids: optionListSchema,
    proprietary_uuid: optionSchema,
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
      .test('end-date-after-start-date', messages.validation.periodRequired, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
    farm_uuid: optionSchema,
  });
};

export const paidInterestReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(paidInterestReportFilterSchema(languageGB)) as any;

export default paidInterestReportFilterSchemaResolver;
