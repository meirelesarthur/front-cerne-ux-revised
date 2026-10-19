// src/constants/Fiscal/dfe/options/dfe-status-options.ts
// Fábrica de opções do filtro "Manifesto" (LOOK-06, `Dfe` — domínio Fiscal,
// execução 044, TASK-DFE-FE-03). Domínio COMPLETO de `tipo_evento` (0..4,
// `DfeFilterForm.status`) — inclui `0` ("Não manifestada"), diferente de
// `dfe-manifest-event-options.ts` (LOOK-04, só as 4 ações reais 1..4 do
// modal de manifestação). "Todos" não é um valor do Map — é a ausência de
// seleção (`status: undefined`), resolvida pelo próprio `Select` via
// `placeholder`/`text.statusAll` no `FilterSideDfe` (TASK-DFE-FE-04), mesmo
// padrão de `launchedAll` em `FilterSideNfseRecebidas`.

import { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

export type DfeStatusValue = 0 | 1 | 2 | 3 | 4;

const labels = (languageGB: LanguageDate): Map<DfeStatusValue, string> => {
  const text = languageGB.dfes.dfe.list.manifestoOptions;
  return new Map<DfeStatusValue, string>([
    [0, text.naoManifestada],
    [1, text.ciencia],
    [2, text.confirmacao],
    [3, text.desconhecimento],
    [4, text.naoRealizada],
  ]);
};

const getLabel = (value: DfeStatusValue, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: DfeStatusValue, languageGB: LanguageDate): Option<DfeStatusValue> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<DfeStatusValue>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const dfeStatusOptions = { getLabel, getOption, options };
