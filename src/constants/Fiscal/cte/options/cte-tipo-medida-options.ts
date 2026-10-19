// src/constants/fiscal/cte/options/cte-tipo-medida-options.ts
// F21 (LK11, mirror `Cte::tiposMedida` legado) — options estáticas, texto/texto.

import type { Option } from '@/@types/option';

const CTE_TIPO_MEDIDA_VALUES = [
  'PESO BRUTO',
  'PESO DECLARADO',
  'PESO CUBADO',
  'PESO AFORADO',
  'PESO AFERIDO',
  'LITRAGEM',
  'CAIXAS',
] as const;

const getLabel = (value: string): string => value;

const getOption = (value: string): Option<string> => ({ label: value, value });

const options = (): Option<string>[] => CTE_TIPO_MEDIDA_VALUES.map((value) => getOption(value));

export const cteTipoMedidaOptions = { getLabel, getOption, options };

export default cteTipoMedidaOptions;
