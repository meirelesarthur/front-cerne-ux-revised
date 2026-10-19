// src/constants/dashboards/financialDashboard/options/financial-year-options.ts
// Fábrica de opções do filtro Ano (`CONTRATO-API-048-04 §2`, `year`, default
// ano corrente) — ano ATUAL até -5, mirror `cashbook-year-options.ts`.

import type { Option } from '@/@types/option';

const YEARS_BACK = 5;

const options = (): Option<number>[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: YEARS_BACK + 1 }, (_, index) => {
    const year = currentYear - index;
    return { label: String(year), value: year };
  });
};

export const financialYearOptions = { options };
