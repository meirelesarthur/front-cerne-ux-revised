// src/constants/CadastrosBase/Proprietarios/options/proprietary-in-use-table-labels.ts
// -----------------------------------------------------------------------------
// Dicionário de rótulos de exibição para as chaves reais de `errors.in_use`
// (`CheckProprietaryDependenciesAction::RESTRICT_TABLES`, shape ARRAY
// `Array<{resource, table, count}>` — as 12 tabelas de negócio com FK
// `RESTRICT` reais vinculadas a `proprietaries.id`). Mesma família de
// dicionário de `addressing-in-use-table-labels.ts`/`client-in-use-table-labels.ts`
// — migração do antigo `ProprietaryInUseDialog.tsx` para o `InUseBlockedDialog`
// genérico.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';

const labels = (languageGB: LanguageDate): Map<string, string> => {
  const tableLabels = languageGB.proprietaries.proprietary.deleteBlocked.tableLabels;

  return new Map([
    ['expenses', tableLabels.expenses],
    ['incomes', tableLabels.incomes],
    ['movements', tableLabels.movements],
    ['transfers', tableLabels.transfers],
    ['areas', tableLabels.areas],
    ['invoices', tableLabels.invoices],
    ['equipments', tableLabels.equipments],
    ['cash_books', tableLabels.cashBooks],
    ['input_entries', tableLabels.inputEntries],
    ['sales', tableLabels.sales],
    ['tickets', tableLabels.tickets],
    ['traceability_configs', tableLabels.traceabilityConfigs],
  ]);
};

// Fallback defensivo: só ativa se a API devolver uma chave nunca vista (nome
// cru da tabela) — mesmo racional de `addressingInUseTableLabels`.
const getLabel = (table: string, languageGB: LanguageDate): string =>
  labels(languageGB).get(table) ?? table;

export const proprietaryInUseTableLabels = { getLabel };
