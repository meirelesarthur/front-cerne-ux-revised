// src/constants/fiscal/cte/options/cte-globalizado-options.ts
// F05 — options estáticas Sim/Não (`globalizado: 0|1`, default create `'0'`,
// Contrato §3.1). Não listada nominalmente no roteiro da Tarefa (que cita só
// natureza/cst/tipoDocumento/tomador/modal/retira) mas necessária ao campo —
// mesmo padrão dos demais binários estáticos deste módulo.

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

const labels = (languageGB?: LanguageDate): Map<'0' | '1', string> =>
  new Map([
    ['0', languageGB?.defaltStrings?.no ?? 'Não'],
    ['1', languageGB?.defaltStrings?.yes ?? 'Sim'],
  ]);

const getLabel = (value: '0' | '1', languageGB?: LanguageDate): string =>
  labels(languageGB).get(value) ?? value;

const getOption = (value: '0' | '1', languageGB?: LanguageDate): Option<'0' | '1'> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB?: LanguageDate): Option<'0' | '1'>[] =>
  Array.from(labels(languageGB), ([value, label]) => ({ label, value }));

export const cteGlobalizadoOptions = { getLabel, getOption, options };

export default cteGlobalizadoOptions;
