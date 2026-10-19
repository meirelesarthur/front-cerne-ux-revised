// src/constants/integracoes/exportMovementsDominio/options/exportMovementsDominio-type-options.ts
// Fábrica de opções do campo `type` da tela "Exportação Movimento Bancário →
// Domínio" (F-116, Integrações) — padrão canônico `(languageGB) => Map`
// (get_pwa_constants_and_mappers_pattern §3.2). Valores fiéis ao legado
// (`index.blade.php:24`, contrato de tela §2.1/§4/FID-G3F CLM-03): 1=Entrada,
// 2=Saída. Labels 100% derivados da tradução — nunca string literal
// (severidade INVIOLÁVEL).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

export const exportMovementsDominioType = {
  INCOME: 1,
  EXPENSE: 2,
} as const;

export type ExportMovementsDominioType =
  (typeof exportMovementsDominioType)[keyof typeof exportMovementsDominioType];

const labels = (languageGB: LanguageDate): Map<ExportMovementsDominioType, string> => {
  const dictionary = languageGB.integrations.exportMovementsDominio.form.typeOptions;
  return new Map([
    [exportMovementsDominioType.INCOME, dictionary.income],
    [exportMovementsDominioType.EXPENSE, dictionary.expense],
  ]);
};

const getLabel = (value: ExportMovementsDominioType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value) ?? String(value);

const getOption = (
  value: ExportMovementsDominioType,
  languageGB: LanguageDate
): Option<ExportMovementsDominioType> => ({ label: getLabel(value, languageGB), value });

const options = (languageGB: LanguageDate): Option<ExportMovementsDominioType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const exportMovementsDominioTypeOptions = { getLabel, getOption, options };
