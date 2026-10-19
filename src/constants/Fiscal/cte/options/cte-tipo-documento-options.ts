// src/constants/fiscal/cte/options/cte-tipo-documento-options.ts
// F11 (LK06) — options estáticas, mirror `App\Enums\CteTipoDocumento`.

import type { Option } from '@/@types/option';
import type { CteTipoDocumentoCode } from '@/@types/v2/Fiscal/cte';

const labels = (): Map<CteTipoDocumentoCode, string> =>
  new Map([
    ['00', 'Declaração'],
    ['10', 'Dutoviário'],
    ['59', 'CFe SAT'],
    ['65', 'NFCe'],
    ['99', 'Outros'],
  ]);

const getLabel = (value: CteTipoDocumentoCode): string => labels().get(value) ?? value;

const getOption = (value: CteTipoDocumentoCode): Option<CteTipoDocumentoCode> => ({
  label: getLabel(value),
  value,
});

const options = (): Option<CteTipoDocumentoCode>[] =>
  Array.from(labels(), ([value, label]) => ({ label, value }));

export const cteTipoDocumentoOptions = { getLabel, getOption, options };

export default cteTipoDocumentoOptions;
