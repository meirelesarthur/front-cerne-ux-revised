// src/validations/schemas/Relatorios/received-interest-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "Juros Recebidos" (esteira
// 97-Esteiras/014, Tarefa 49). Mirror ESTRUTURAL de
// `receipt-schedule-report-filter-schema.ts` (par `start_date`/`end_date`,
// `end_date >= start_date` via `.test()`), MAS as datas são OBRIGATÓRIAS
// aqui (`api-contract-juros-recebidos.md §3`: `start_date`/`end_date`
// `required`), divergindo do irmão `AgendaRecebimentos` (datas opcionais) e
// espelhando `paid-interest-report-filter-schema.ts` (F-290) para esse ponto.
//
// `client_uuids`/`proprietary_uuid`/`farm_uuid` são OPCIONAIS, SEM validação
// de forma — a autoridade final é o 422 do backend (`Rule::exists` por
// campo). `format` é o único campo sempre obrigatório (default `pdf`,
// seletor `noClearable`, mirror `AgendaRecebimentos`).
//
// `proprietary_uuid` (DEC-043): validado como qualquer Option normal — SEM
// nenhuma regra especial de "campo sem efeito". A API que ignora o valor,
// não o schema do front.
//
// O schema valida a FORMA INTERNA do form (Option-based, react-select), NÃO
// o payload final do service (`ReceivedInterestReportParams`):
//   client_uuids: string[]
//   proprietary_uuid: Option<string> | null
//   start_date: string | null
//   end_date: string | null
//   farm_uuid: Option<string> | null
//   format: Option<ReportFormat> | null
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

export const receivedInterestReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.receivedInterestReport.report;

  return yup.object({
    client_uuids: yup.array(yup.string().required()).default([]),
    proprietary_uuid: optionSchema,
    start_date: yup.string().trim().nullable().required(messages.validation.periodRequired),
    end_date: yup
      .string()
      .trim()
      .nullable()
      .required(messages.validation.periodRequired)
      .test('end-date-after-start-date', messages.validation.periodOrder, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
    farm_uuid: optionSchema,
    format: v.option<ReportFormat>(),
  });
};

export const receivedInterestReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(receivedInterestReportFilterSchema(languageGB)) as any;

export default receivedInterestReportFilterSchemaResolver;
