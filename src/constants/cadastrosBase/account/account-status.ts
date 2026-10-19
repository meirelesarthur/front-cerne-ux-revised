// src/constants/cadastrosBase/account/account-status.ts
// Fábricas de opções dos enums `type` (AccountType) e `type_cnab` (Cnab) de
// Contas Bancárias (Account — Cadastros Base / Financeiros, execução 025,
// TASK-FE-561). Padrão canônico `(languageGB) => Map` + `getLabel`/
// `getOption`/`options`, mirror `provider-type-options.ts`.
//
// `is_enabled` (Ativo/Inativo) NÃO tem factory própria aqui — reaproveita o
// `statusOptions` genérico já existente em `src/constants/options/statusOptions.ts`
// (boolean-keyed, `getLabel/getOption/options`), usado tanto no filtro
// quanto no form (ver `Account-FrontEnd-contrato.md §5.1`).

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

import type { AccountType } from './account-type';

// ============================================
// Tipo da conta (`type` — C/P/I/L)
// ============================================

const typeLabels = (languageGB: LanguageDate): Map<AccountType, string> =>
  new Map([
    ['C', languageGB.accounts.account.form.typeOptions.current],
    ['P', languageGB.accounts.account.form.typeOptions.savings],
    ['I', languageGB.accounts.account.form.typeOptions.investment],
    ['L', languageGB.accounts.account.form.typeOptions.cashBook],
  ]);

const getTypeLabel = (type: AccountType, languageGB: LanguageDate): string =>
  typeLabels(languageGB).get(type)!;

const getTypeOption = (type: AccountType, languageGB: LanguageDate): Option<AccountType> => ({
  label: getTypeLabel(type, languageGB),
  value: type,
});

const typeOptions = (languageGB: LanguageDate): Option<AccountType>[] =>
  Array.from(typeLabels(languageGB)).map(([value, label]) => ({ value, label }));

export const accountTypeOptions = {
  getLabel: getTypeLabel,
  getOption: getTypeOption,
  options: typeOptions,
};

// Badge de Tipo na grid (TASK-FE-564) — estética, sem regra de negócio
// (sugestão do dev, revisável sem gate).
export const accountTypeColor: Record<AccountType, string> = {
  C: 'blue',
  P: 'green',
  I: 'purple',
  L: 'gray',
};

// ============================================
// Tipo de Boleto (`type_cnab` — 1=CNAB240, 2=CNAB400)
// ============================================

const cnabLabels = (languageGB: LanguageDate): Map<1 | 2, string> =>
  new Map([
    [1, languageGB.accounts.account.form.cnabOptions.cnab240],
    [2, languageGB.accounts.account.form.cnabOptions.cnab400],
  ]);

const cnabOptions = (languageGB: LanguageDate): Option<1 | 2>[] =>
  Array.from(cnabLabels(languageGB)).map(([value, label]) => ({ value, label }));

export const accountCnabOptions = { options: cnabOptions };
