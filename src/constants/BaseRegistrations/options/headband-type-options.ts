// src/constants/BaseRegistrations/options/headband-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do enum `type` (HeadbandTypeSlug) — TASK-HB-FE-03. Mirror
// exato de `src/constants/Marker/options/marker-type-options.ts`: padrão
// canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2) — NUNCA um array
// `Option<string>[]` inline no componente. Usada SÓ no filtro da listagem
// (`FilterSideHeadband.tsx`) — a coluna da grid usa `type_label`, já
// traduzido pela API (ver comentário de topo de `Headbands/index.tsx`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import { headbandType, HeadbandType } from '../headband-type';

const labels = (languageGB: LanguageDate): Map<HeadbandType, string> =>
  new Map([
    [headbandType.central, languageGB.baseRegistrations.headband.type.central],
    [headbandType.partnerLogo, languageGB.baseRegistrations.headband.type.partnerLogo],
  ]);

const getLabel = (value: HeadbandType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: HeadbandType, languageGB: LanguageDate): Option<HeadbandType> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<HeadbandType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const headbandTypeOptions = { getLabel, getOption, options };
