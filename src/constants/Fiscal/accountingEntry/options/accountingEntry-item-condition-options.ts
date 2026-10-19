// src/constants/Fiscal/accountingEntry/options/accountingEntry-item-condition-options.ts
// Fábrica de opções de Condição (Débito/Crédito) da linha do lançamento
// (Partida Dobrada, TASK-PD-FE-03). SÓ 2 entradas — NUNCA adicionar uma 3ª
// "Ambos" (dead path, ver `accountingEntry-item-condition.ts`).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import { AccountingEntryItemCondition } from '@/@types/v2/Fiscal/accountingEntry';

import { accountingEntryItemCondition } from '../accountingEntry-item-condition';

const labels = (languageGB: LanguageDate): Map<AccountingEntryItemCondition, string> =>
  new Map([
    [
      accountingEntryItemCondition.debit,
      languageGB.accountingEntries.accountingEntry.condition.debit,
    ],
    [
      accountingEntryItemCondition.credit,
      languageGB.accountingEntries.accountingEntry.condition.credit,
    ],
  ]);

const getLabel = (value: AccountingEntryItemCondition, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: AccountingEntryItemCondition,
  languageGB: LanguageDate
): Option<AccountingEntryItemCondition> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<AccountingEntryItemCondition>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const accountingEntryItemConditionOptions = { getLabel, getOption, options };
