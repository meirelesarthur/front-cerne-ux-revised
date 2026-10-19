// src/constants/fiscal/cte/options/cte-cst-options.ts
// F06 (LK02) — options estáticas, mirror `CteRequest::rules()::cst`
// (`in:00,20,40,41,51,60,90`). Sem tradução própria (código fiscal SEFAZ).

import type { Option } from '@/@types/option';

const CTE_CST_VALUES = ['00', '20', '40', '41', '51', '60', '90'] as const;

const getLabel = (value: string): string => value;

const getOption = (value: string): Option<string> => ({ label: value, value });

const options = (): Option<string>[] => CTE_CST_VALUES.map((value) => getOption(value));

export const cteCstOptions = { getLabel, getOption, options };

export default cteCstOptions;
