// src/constants/fiscal/cte/options/cte-modal-options.ts
// F19 (LK09) — options estáticas, mirror `App\Enums\CteModal`.

import type { Option } from '@/@types/option';
import type { CteModalCode } from '@/@types/v2/Fiscal/cte';

const labels = (): Map<CteModalCode, string> =>
  new Map([
    ['01', 'Rodoviário'],
    ['02', 'Aéreo'],
    ['03', 'Aquaviário'],
    ['04', 'Ferroviário'],
    ['05', 'Dutoviário'],
    ['06', 'Multimodal'],
  ]);

const getLabel = (value: CteModalCode): string => labels().get(value) ?? value;

const getOption = (value: CteModalCode): Option<CteModalCode> => ({
  label: getLabel(value),
  value,
});

const options = (): Option<CteModalCode>[] =>
  Array.from(labels(), ([value, label]) => ({ label, value }));

export const cteModalOptions = { getLabel, getOption, options };

export default cteModalOptions;
