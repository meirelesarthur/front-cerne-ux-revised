// src/constants/FeedlotSectors/feedlot-sector-status.ts
// Enum + mapa de cor CO-LOCADOS para o campo booleano `is_active` de
// FeedlotSector (get_pwa_constants_and_mappers_pattern §4/§5.1) — mirror
// exato do padrão `feedlot-yard-status.ts`. A fábrica de opções
// (Map + getLabel/getOption/options) fica em
// `options/feedlot-sector-status-options.ts`, importando este enum.

export const feedlotSectorStatus = {
  inactive: false,
  active: true,
} as const;

export type FeedlotSectorStatusValue = (typeof feedlotSectorStatus)[keyof typeof feedlotSectorStatus];

export const feedlotSectorStatusColor: Record<'true' | 'false', string> = {
  true: 'green',
  false: 'gray',
};
