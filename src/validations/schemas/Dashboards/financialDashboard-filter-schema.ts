// src/validations/schemas/Dashboards/financialDashboard-filter-schema.ts
// Schema do filtro Financeiro (execução 048, TASK-04-FE) — os 3 campos são
// opcionais no contrato de API (`year`/`month` default mês corrente,
// `cost_center_uuid` default todos). Derivado de `fieldValidationSchema`
// (SEVERIDADE inviolável), mirror `cashbookDashboard-filter-schema.ts`.

import * as yup from 'yup';

export const financialDashboardFilterSchema = () => {
  return yup.object({
    year: yup.object().nullable().default(null),
    month: yup.object().nullable().default(null),
    costCenter: yup.object().nullable().default(null),
  });
};
