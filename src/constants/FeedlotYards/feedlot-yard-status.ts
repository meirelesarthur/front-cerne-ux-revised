// src/constants/FeedlotYards/feedlot-yard-status.ts
// Enum + mapa de cor CO-LOCADOS para o campo booleano `is_active` de
// FeedlotYard (get_pwa_constants_and_mappers_pattern §4/§5.1) — mirror do
// padrão genérico `status`/`statusColor`. A fábrica de opções
// (Map + getLabel/getOption/options) fica em `options/feedlot-yard-status-options.ts`,
// importando este enum.

export const feedlotYardStatus = {
  inactive: false,
  active: true,
} as const;

export type FeedlotYardStatusValue = (typeof feedlotYardStatus)[keyof typeof feedlotYardStatus];

export const feedlotYardStatusColor: Record<'true' | 'false', string> = {
  true: 'green',
  false: 'gray',
};
