// src/constants/FeedlotCorrals/feedlot-corral-installation-type.ts
// Enum `installation_type` do Curral — mirror `App\Enums\InstallationType`
// (GB.Cerne.Api). A fábrica de opções (Map + getLabel/getOption/options)
// fica em `options/feedlot-corral-installation-type-options.ts`, importando
// este enum (get_pwa_constants_and_mappers_pattern §3.2/§4).

export const feedlotCorralInstallationType = {
  cover: 'CO',
  uncovered: 'DE',
} as const;

export type FeedlotCorralInstallationTypeValue =
  (typeof feedlotCorralInstallationType)[keyof typeof feedlotCorralInstallationType];
