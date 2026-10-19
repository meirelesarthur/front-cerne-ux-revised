// src/constants/fiscal/cte/options/cte-grupo-correcao-options.ts
// D19/LK20 — options ESTÁTICAS do dialog "Carta de Correção" (TASK-CTE-FE-11),
// mirror `Cte::gruposCte()` (legado, `agro365/app/Cte.php`) — 28 grupos
// literais do padrão CT-e SEFAZ, label = value (mesmo padrão de
// `cte-cst-options.ts`, sem tradução própria — nomenclatura fiscal fixa).

import type { Option } from '@/@types/option';

const CTE_GRUPO_CORRECAO_VALUES = [
  'ide',
  'toma03',
  'toma04',
  'enderToma',
  'autXML',
  'compl',
  'ObsCont',
  'ObsFisco',
  'emit',
  'enderEmit',
  'rem',
  'enderReme',
  'infNF',
  'infOutros',
  'infUnidTransp',
  'IacUnidCarga',
  'infUnidCarga',
  'exped',
  'enderExped',
  'receb',
  'enderReceb',
  'dest',
  'enderDest',
  'vPrest',
  'Comp',
  'imp',
  'ICMS',
  'infQ',
  'docAnt',
] as const;

const getLabel = (value: string): string => value;

const getOption = (value: string): Option<string> => ({ label: value, value });

const options = (): Option<string>[] => CTE_GRUPO_CORRECAO_VALUES.map((value) => getOption(value));

export const cteGrupoCorrecaoOptions = { getLabel, getOption, options };

export default cteGrupoCorrecaoOptions;
