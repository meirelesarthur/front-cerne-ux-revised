// src/constants/fiscal/cte/options/cte-estado-options.ts
// Options do filtro `estado` (FL01, mirror `App\Enums\CteEstado` do backend)
// — fábrica canônica `(languageGB) => Map` (get_pwa_constants_and_mappers_pattern §3.2).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { CteEstado } from '@/@types/v2/Fiscal/cte';

const labels = (languageGB: LanguageDate): Map<CteEstado, string> =>
  new Map([
    ['novo', languageGB.ctes.cte.estadoOptions.novo],
    ['aprovado', languageGB.ctes.cte.estadoOptions.aprovado],
    ['rejeitado', languageGB.ctes.cte.estadoOptions.rejeitado],
    ['cancelado', languageGB.ctes.cte.estadoOptions.cancelado],
  ]);

const getLabel = (value: CteEstado, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? value;

const getOption = (value: CteEstado, languageGB: LanguageDate): Option<CteEstado> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<CteEstado>[] =>
  Array.from(labels(languageGB), ([value, label]) => ({ label, value }));

export const cteEstadoOptions = { getLabel, getOption, options };

export default cteEstadoOptions;
