// src/constants/dashboards/depreciationDashboard/options/depreciation-year-options.ts
// Fábrica de opções do filtro Ano (`CONTRATO-API-048-02 §2` — `year` opcional,
// default ano corrente). Dinâmico (ano corrente até -4, 5 anos) — não é um
// enum fixo como os demais filtros, por isso não segue o padrão `Map`
// estático (`get_pwa_constants_and_mappers_pattern §4`, exceção documentada:
// valor calculado em runtime, não catálogo).

import type { Option } from '@/@types/option';

const YEARS_BACK = 4;

const options = (referenceYear: number = new Date().getFullYear()): Option<number>[] =>
  Array.from({ length: YEARS_BACK + 1 }, (_, index) => {
    const year = referenceYear - index;
    return { label: String(year), value: year };
  });

export const depreciationYearOptions = { options };
