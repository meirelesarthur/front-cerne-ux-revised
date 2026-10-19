// src/constants/fiscal/cte/options/cte-unidade-medida-options.ts
// F20 (LK10, mirror `Cte::unidadesMedida` legado) — options estáticas:
// 00=M3, 01=KG, 02=TON, 03=UNIDADE, 04=M2.

import type { Option } from '@/@types/option';

const labels = (): Map<string, string> =>
  new Map([
    ['00', 'M3'],
    ['01', 'KG'],
    ['02', 'TON'],
    ['03', 'UNIDADE'],
    ['04', 'M2'],
  ]);

const getLabel = (value: string): string => labels().get(value) ?? value;

const getOption = (value: string): Option<string> => ({ label: getLabel(value), value });

const options = (): Option<string>[] =>
  Array.from(labels(), ([value, label]) => ({ label, value }));

export const cteUnidadeMedidaOptions = { getLabel, getOption, options };

export default cteUnidadeMedidaOptions;
