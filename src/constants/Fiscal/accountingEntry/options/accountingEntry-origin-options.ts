// src/constants/Fiscal/accountingEntry/options/accountingEntry-origin-options.ts
// Fábrica de opções de Origem do lançamento (Partida Dobrada, TASK-PD-FE-03).
// Mirror `xml-document-status-options.ts` (getLabel/getOption/options
// derivados de `languageGB`, Lei 10 — zero string hardcoded).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import { AccountingEntryOrigin } from '@/@types/v2/Fiscal/accountingEntry';

import { accountingEntryOrigin } from '../accountingEntry-origin';

const labels = (languageGB: LanguageDate): Map<AccountingEntryOrigin, string> =>
  new Map([
    [
      accountingEntryOrigin.administrative,
      languageGB.accountingEntries.accountingEntry.origin.administrative,
    ],
    [
      accountingEntryOrigin.agriculture,
      languageGB.accountingEntries.accountingEntry.origin.agriculture,
    ],
    [
      accountingEntryOrigin.livestock,
      languageGB.accountingEntries.accountingEntry.origin.livestock,
    ],
  ]);

const getLabel = (value: AccountingEntryOrigin, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: AccountingEntryOrigin,
  languageGB: LanguageDate
): Option<AccountingEntryOrigin> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<AccountingEntryOrigin>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const accountingEntryOriginOptions = { getLabel, getOption, options };
