// src/constants/fiscal/cte/options/cte-tomador-options.ts
// F17 (LK08) — options estáticas, mirror `App\Enums\CteTomador`.

import type { Option } from '@/@types/option';
import type { CteTomadorCode } from '@/@types/v2/Fiscal/cte';

const labels = (): Map<CteTomadorCode, string> =>
  new Map([
    [0, 'Remetente'],
    [1, 'Expedidor'],
    [2, 'Recebedor'],
    [3, 'Destinatário'],
  ]);

const getLabel = (value: CteTomadorCode): string => labels().get(value) ?? String(value);

const getOption = (value: CteTomadorCode): Option<CteTomadorCode> => ({
  label: getLabel(value),
  value,
});

const options = (): Option<CteTomadorCode>[] =>
  Array.from(labels(), ([value, label]) => ({ label, value }));

export const cteTomadorOptions = { getLabel, getOption, options };

export default cteTomadorOptions;
