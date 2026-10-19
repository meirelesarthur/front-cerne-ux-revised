// src/constants/areas/area/options/area-type-options.ts
// Fábrica de opções do campo `type` de Area — padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2, mirror
// `feedlot-street-orientation-options.ts`). Fonte do enum:
// `../areas-status.ts` (mirror `App\Enums\AreaType`).

import { AreaType, type AreaTypeValue } from '@/constants/areas/area/areas-status';

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<AreaTypeValue, string> =>
  new Map([
    [AreaType.PRODUCTIVE, languageGB.areas.area.typeOptions.productive],
    [AreaType.RESERVE, languageGB.areas.area.typeOptions.reserve],
  ]);

const getLabel = (value: AreaTypeValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: AreaTypeValue, languageGB: LanguageDate): Option<AreaTypeValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<AreaTypeValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const areaTypeOptions = { getLabel, getOption, options };
