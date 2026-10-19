// src/validations/schemas/NfeReport/nfe-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório "NFe/Emitidas" (F-287,
// esteira 97-Esteiras/079, TASK-F287-FE-01). Mirror ESTRUTURAL de
// `nfe-product-report-filter-schema.ts` (par `start_date`/`end_date` sempre
// obrigatório via `fieldValidationSchema(languageGB).date()`, mensagem
// PRÓPRIA do módulo para `end_date >= start_date` via `.test()`).
//
// Nenhum dos 7 filtros restantes (`status`, `client_ids`, `farm_ids`,
// `center_ids`, `issuer_id`, `provider_id`, `format`) é obrigatório —
// `NfeReportRequest` só exige `start_date`/`end_date` (F-287-plano-api-
// database §3) — por isso nenhum `.min(1)` nos arrays.
//
// BUGFIX (2026-09-11, dono): `status` usava `v.option<NfeEstado>()` —
// helper de `fieldValidationSchema` que é `.nullable().required(...)` (ver
// `src/validations/field-validation-schema.ts`). Em Yup, `.nullable()` só
// amplia o TIPO aceito; `.required()` continua rejeitando `null`. Como
// `status` nasce `null` em `buildPristineValues` (index.tsx) e a API não o
// exige, um submit só com `start_date`/`end_date` falhava a validação do
// resolver SEM disparar `handleDownload` — falha silenciosa (RHF não chama
// o submit handler quando o schema reprova). `format` não tinha o mesmo
// problema porque SEMPRE recebe um default não-nulo ('pdf') em
// `buildPristineValues` (mirror exato de `type` em
// `nfe-product-report-filter-schema.ts`/Faturamento F-286, que também usa
// `v.option()` mas nunca fica `null`). Correção: `status`, por ser
// genuinamente opcional e nascer `null`, usa o mesmo `optionSchema`
// nullable-sem-required já aplicado a `issuer_id`/`provider_id`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { NfeReportFormat } from '@/@types/v2/NfeReport';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const nfeReportFilterSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.nfeReport.report;

  return yup.object({
    start_date: v.date(),
    end_date: v
      .date()
      .test(
        'end-date-after-start-date',
        messages.validation.endDateBeforeStartDate,
        (value, context) => {
          const parent = context.parent as { start_date?: string | null };
          if (!value || !parent.start_date) return true;
          return value >= parent.start_date;
        }
      ),
    // Opcional de verdade (nasce `null`, API não exige): NÃO usar
    // `v.option()` (required) aqui — ver nota de bugfix acima.
    status: optionSchema,
    client_ids: yup.array(yup.string().required()).default([]),
    farm_ids: yup.array(yup.string().required()).default([]),
    center_ids: yup.array(yup.string().required()).default([]),
    issuer_id: optionSchema,
    provider_id: optionSchema,
    // `format` continua com `v.option()` (required) porque SEMPRE recebe
    // default não-nulo 'pdf' em `buildPristineValues` — nunca chega null.
    format: v.option<NfeReportFormat>(),
  });
};

export const nfeReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(nfeReportFilterSchema(languageGB)) as any;

export default nfeReportFilterSchemaResolver;
