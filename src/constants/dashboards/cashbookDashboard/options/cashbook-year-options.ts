// src/constants/dashboards/cashbookDashboard/options/cashbook-year-options.ts
// Fábrica de opções do filtro Ano (`CashBookDashboardRequest::rules()['year']`,
// FLT-01 do roteiro) — ano ATUAL até -5 (mirror do range usado pelo Cadastro
// legado de CashBook). Rótulo é o próprio número do ano — sem i18n (mesma
// classe de decisão de `cash-book-period.ts`: não há texto a traduzir).

import type { Option } from '@/@types/option';

const YEARS_BACK = 5;

const options = (): Option<number>[] => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: YEARS_BACK + 1 }, (_, index) => {
    const year = currentYear - index;
    return { label: String(year), value: year };
  });
};

export const cashbookYearOptions = { options };
