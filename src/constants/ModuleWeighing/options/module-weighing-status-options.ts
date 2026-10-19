// src/constants/ModuleWeighing/options/module-weighing-status-options.ts
// Fábrica de opções do enum `status` (ModuleWeighingStatus) — padrão
// canônico `(languageGB) => Map` + `getLabel`/`getOption`/`options`
// (get_pwa_constants_and_mappers_pattern §3.2, mirror
// `order-status-options.ts`). Usada pelo dot indicator da coluna LM-001
// (`getLabel`, tooltip) — a listagem NÃO tem Select de status (fora dos 5
// filtros `FM-001..FM-005`), então `options()` fica disponível para as
// Tarefas futuras que precisarem (ex.: legenda, wizard).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { ModuleWeighingStatus } from '@/@types/v2/ModuleWeighing/module-weighing';

import { moduleWeighingStatus } from '../module-weighing-status';

const labels = (languageGB: LanguageDate): Map<ModuleWeighingStatus, string> => {
  const text = languageGB.moduleWeighing.moduleWeighing.common.status;
  return new Map([
    [moduleWeighingStatus.preCadastro, text.preCadastro],
    [moduleWeighingStatus.pesagemInicial, text.pesagemInicial],
    [moduleWeighingStatus.classificacao, text.classificacao],
    [moduleWeighingStatus.pesagemFinal, text.pesagemFinal],
    [moduleWeighingStatus.finalizado, text.finalizado],
  ]);
};

const getLabel = (value: ModuleWeighingStatus, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: ModuleWeighingStatus,
  languageGB: LanguageDate
): Option<ModuleWeighingStatus> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<ModuleWeighingStatus>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const moduleWeighingStatusOptions = { getLabel, getOption, options };
