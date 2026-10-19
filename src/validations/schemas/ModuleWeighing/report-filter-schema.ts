// src/validations/schemas/ModuleWeighing/report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup do filtro do Relatório (FE-SCR-06, `TASK-MWG-FE-09`,
// `GAP-PES-04`, retrabalho `TASK-MWG-FE-10`) — `startDate`/`endDate` são
// OBRIGATÓRIOS (mirror do legado `agro365/.../module-weighing/
// report.blade.php:19,22`, causa-raiz do achado do dono); os 5 filtros de
// domínio (`type`/`category`/`warehouse`/`product`/`client`, `FM-008..
// FM-012`) permanecem OPCIONAIS, intocados. `end >= start` só valida quando
// ambas as datas estão presentes (agora sempre, dado o `.required()` acima).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const moduleWeighingReportFilterSchema = (languageGB: LanguageDate) => {
  const text = languageGB.moduleWeighing.moduleWeighing.report.validation;

  return yup.object({
    startDate: yup.string().nullable().required(text.startDateRequired),
    endDate: yup
      .string()
      .nullable()
      .required(text.endDateRequired)
      .test('end-after-start', text.endDateBeforeStart, (value, ctx) => {
        const { startDate } = ctx.parent as { startDate?: string | null };
        if (!value || !startDate) return true;
        return new Date(value) >= new Date(startDate);
      }),
    type: yup
      .object({ value: yup.number().required(), label: yup.string().required() })
      .nullable()
      .defined(),
    category: yup
      .object({ value: yup.string().required(), label: yup.string().required() })
      .nullable()
      .defined(),
    warehouse: yup
      .object({ value: yup.string().required(), label: yup.string().required() })
      .nullable()
      .defined(),
    product: yup
      .object({ value: yup.string().required(), label: yup.string().required() })
      .nullable()
      .defined(),
    client: yup
      .object({ value: yup.string().required(), label: yup.string().required() })
      .nullable()
      .defined(),
  });
};

export const moduleWeighingReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(moduleWeighingReportFilterSchema(languageGB)) as any;
