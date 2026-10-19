// src/constants/Addressing/options/addressing-in-use-table-labels.ts
// -----------------------------------------------------------------------------
// Dicionário de rótulos de exibição para as chaves reais de `errors.in_use`
// (`CheckAddressingDependenciesAction.php` — shape ARRAY
// `Array<{resource, table, count}>`, `table` físico estável:
// `addressings` (filhos diretos) e `products` (produtos vinculados)).
// Mesma família de dicionário de `fodder-in-use-table-labels.ts` — estende o
// padrão já usado em produção (Fodder/Grazing/ParameterWeight) para o
// canário do `InUseBlockedDialog` genérico
// (FRONT-03-InUseBlockedDialog.md, Estratégia C).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';

const labels = (languageGB: LanguageDate): Map<string, string> =>
  new Map([
    ['addressings', languageGB.baseRegistrations.addressing.deleteBlocked.tableLabels.addressings],
    ['products', languageGB.baseRegistrations.addressing.deleteBlocked.tableLabels.products],
  ]);

// Fallback defensivo: só ativa se a API devolver uma chave nunca vista (nome
// cru da tabela) — mesmo racional de `fodderInUseTableLabels`.
const getLabel = (table: string, languageGB: LanguageDate): string =>
  labels(languageGB).get(table) ?? table;

export const addressingInUseTableLabels = { getLabel };
