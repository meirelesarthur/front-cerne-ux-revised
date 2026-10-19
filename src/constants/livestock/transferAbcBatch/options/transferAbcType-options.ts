// src/constants/livestock/transferAbcBatch/options/transferAbcType-options.ts
// Fábrica `(languageGB) => Map` do enum `TransferAbcType` — mirror
// `get_pwa_constants_and_mappers_pattern` §3.2 (getLabel/getOption/options).

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { TransferAbcType } from '@/@types/v2/Livestock/transferAbcBatch';

import { transferAbcType } from '../transferAbcBatch-status';

function labels(languageGB: LanguageDate): Map<TransferAbcType, string> {
  const text = languageGB.livestock.transferAbcBatch.type;
  return new Map([
    [transferAbcType.entrada, text.entrada],
    [transferAbcType.saida, text.saida],
  ]);
}

function getLabel(value: TransferAbcType, languageGB: LanguageDate): string {
  return labels(languageGB).get(value) ?? String(value);
}

function getOption(value: TransferAbcType, languageGB: LanguageDate): Option<TransferAbcType> {
  return { label: getLabel(value, languageGB), value };
}

function options(languageGB: LanguageDate): Option<TransferAbcType>[] {
  return Array.from(labels(languageGB), ([value, label]) => ({ label, value }));
}

export const transferAbcTypeOptions = { getLabel, getOption, options };
