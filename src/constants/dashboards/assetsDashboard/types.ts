// src/constants/dashboards/assetsDashboard/types.ts
// Enums do filtro/estado da dashboard Ativos (execução 046, TASK-AT-FE-03).

/** Período do filtro (`AT-FILTER-01`) — valores aceitos pela API (`Rule::in(['3','6','12'])`). */
export const assetsPeriodMonths = {
  m3: '3',
  m6: '6',
  m12: '12',
} as const;

/** Status LEGADO de Ativo/Inativo (`AT-FILTER-03`, `LKP-004`) — distinto do enum operacional abaixo. */
export const assetsLegacyStatus = {
  active: 1,
  inactive: 2,
} as const;
