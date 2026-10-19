// src/validations/schemas/LedgerReport/ledger-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Livro Razão" (F-274,
// 97-Esteiras/008, TASK-FE-LR-01). Mirror ESTRUTURAL de
// `CostCenterReport/cost-center-report-filter-schema.ts` (par `start_date`/
// `end_date` sempre obrigatório, `end_date >= start_date` via `.test()`).
//
// Decisão do dono (contrato-api §7 + decisão de lote 2026-09-09): bug de
// regra de negócio do legado é reproduzido, não corrigido. `cost_center_uuid`
// e `plan_account_uuid` NÃO recebem `.test()` cruzado nem `required_with`
// (GAP-LR-02); `proprietary_uuid` não é removido do form (GAP-LR-03). O
// `LedgerReportRequest` valida os 3 ISOLADAMENTE (`sometimes`) — formalizar
// co-obrigatoriedade no cliente mudaria o comportamento (relatório vazio
// viraria erro de formulário).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { LedgerReportCondition } from '@/@types/v2/LedgerReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const ledgerReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.ledgerReport.report;

  return yup.object({
    account_uuid: v.option<string>().required(messages.validation.accountRequired),
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
    // `condition` nasce preenchido ('S') e o select é `noClearable` — o
    // `required` aqui é rede de segurança, não UX (TASK-FE-LR-02 §1).
    condition: v.option<LedgerReportCondition>().required(messages.validation.conditionRequired),
    proprietary_uuid: optionSchema,
    cost_center_uuid: optionSchema,
    plan_account_uuid: optionSchema,
    category_uuids: yup.array(yup.string().required()).default([]),
  });
};

export const ledgerReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(ledgerReportFilterSchema(languageGB)) as any;

export default ledgerReportFilterSchemaResolver;
