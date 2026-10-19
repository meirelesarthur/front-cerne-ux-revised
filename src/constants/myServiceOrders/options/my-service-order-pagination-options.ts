// src/constants/myServiceOrders/options/my-service-order-pagination-options.ts
// -----------------------------------------------------------------------------
// Fábrica de options do campo `pagination_quantity` do filtro de Minhas OS
// (contrato de tela §2, TASK-MOS-FE-01). Mirror `monitoringPaginationOptions`
// — MESMA whitelist de valores, mas arquivo PRÓPRIO do módulo (decisão do
// contrato: é uma constante de módulo, não uma opção de domínio
// compartilhável — mirror da decisão que `Monitoring` já tomou de ter a sua
// própria fábrica, mesmo idêntica em valores). Rótulos são números puros
// (não dependem de tradução), mantidos fora de `languageMyServiceOrders`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

const PAGINATION_QUANTITY_VALUES = [10, 30, 50, 80, 100, 200] as const;

export const myServiceOrderPaginationOptions = {
  options: (): Option<number>[] =>
    PAGINATION_QUANTITY_VALUES.map((v) => ({ label: String(v), value: v })),
  getOption: (value: number): Option<number> => ({ label: String(value), value }),
};
