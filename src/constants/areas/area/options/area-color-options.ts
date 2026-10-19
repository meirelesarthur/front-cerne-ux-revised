// src/constants/areas/area/options/area-color-options.ts
// Fábrica de opções do campo `color` de Area — paleta FECHADA de 14 cores
// (`App\Enums\AreaColor`, mirror EXATO de
// `src/constants/Grazing/options/grazing-color-options.ts`, MESMO Enum de
// backend consumido por `AreaRequest`/`GrazingRequest`). Padrão canônico
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2). Fonte do enum:
// `../areas-status.ts`.
//
// UX-GAP-01-Cor (`CONTRATO-tela-frontend-area.md §6`): o `cerne` não tem
// swatch/color-select de paleta fechada — o `Select` de cor com chip
// (TASK-FE-420) consome este factory para popular as opções; o chip em si
// lê `areaColor[value].hex` (`../areas-status.ts`).

import { AreaColor, type AreaColorValue } from '@/constants/areas/area/areas-status';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB: LanguageDate): Map<AreaColorValue, string> => {
  const text = languageGB.areas.area.colorOptions;
  return new Map([
    [AreaColor.WHITE, text.white],
    [AreaColor.BLUE, text.blue],
    [AreaColor.BLACK, text.black],
    [AreaColor.GREEN, text.green],
    [AreaColor.YELLOW, text.yellow],
    [AreaColor.RED, text.red],
    [AreaColor.GRAY, text.gray],
    [AreaColor.LIGHT_GRAY, text.lightGray],
    [AreaColor.LIGHT_BLUE, text.lightBlue],
    [AreaColor.DARK_BLUE, text.darkBlue],
    [AreaColor.TURQUOISE, text.turquoise],
    [AreaColor.DARK_GREEN, text.darkGreen],
    [AreaColor.LIGHT_GREEN, text.lightGreen],
    [AreaColor.ORANGE, text.orange],
  ]);
};

const getLabel = (value: AreaColorValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? value;

const getOption = (value: AreaColorValue, languageGB: LanguageDate): Option<AreaColorValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<AreaColorValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const areaColorOptions = { getLabel, getOption, options };
