// src/constants/monitoring/options/monitoring-pagination-options.ts
// -----------------------------------------------------------------------------
// Fábrica de options do campo `pagination_quantity` do filtro de
// Monitoramento (contrato de tela §5.2, TASK-MO-FE-01). Rótulos são números
// puros (não dependem de tradução) — mantidos fora de `languageMonitoring`
// por não terem texto humano a traduzir; a ARRAY de valores permitidos vive
// aqui em `constants/`, nunca inline no componente (Lei das constantes,
// get_pwa_constants_and_mappers_pattern §1).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

const PAGINATION_QUANTITY_VALUES = [10, 30, 50, 80, 100, 200] as const;

export const monitoringPaginationOptions = {
  options: (): Option<number>[] =>
    PAGINATION_QUANTITY_VALUES.map((v) => ({ label: String(v), value: v })),
  getOption: (value: number): Option<number> => ({ label: String(value), value }),
};
