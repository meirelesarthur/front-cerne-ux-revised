// src/constants/AccountingGroupers/options/accounting-grouper-in-use-table-labels.ts
// -----------------------------------------------------------------------------
// Dicionário de rótulos de exibição para as chaves reais de `errors.in_use`
// (`CheckAccountingGrouperDependenciesAction.php` — shape ARRAY
// `Array<{resource, table, count}>`, `table` físico estável:
// `accounting_groupers` (filhos diretos) e `financial_categories`
// (categorias financeiras vinculadas)). Mesma família de dicionário de
// `fodder-in-use-table-labels.ts` / `addressing-in-use-table-labels.ts` —
// canário do `InUseBlockedDialog` genérico
// (FRONT-03-InUseBlockedDialog.md, Estratégia C).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';

const labels = (languageGB: LanguageDate): Map<string, string> =>
  new Map([
    [
      'accounting_groupers',
      languageGB.baseRegistrations.accountingGroupers.deleteBlocked.tableLabels.accounting_groupers,
    ],
    [
      'financial_categories',
      languageGB.baseRegistrations.accountingGroupers.deleteBlocked.tableLabels
        .financial_categories,
    ],
  ]);

// Fallback defensivo: só ativa se a API devolver uma chave nunca vista (nome
// cru da tabela) — mesmo racional de `fodderInUseTableLabels`.
const getLabel = (table: string, languageGB: LanguageDate): string =>
  labels(languageGB).get(table) ?? table;

export const accountingGrouperInUseTableLabels = { getLabel };
