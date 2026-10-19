// src/constants/Contador/options/contador-in-use-table-labels.ts
// -----------------------------------------------------------------------------
// Dicionário de rótulos de exibição para as chaves reais de `errors.in_use`
// (`ContadorRepository::hasDependents()` — shape ARRAY
// `Array<{resource, table, count}>`, `table` físico estável:
// `contador_issue`/`cash_books`/`integration_dominios`, as 3 dependências
// reais RESTRICT do Contador).
// Mesma família de dicionário de `addressing-in-use-table-labels.ts` — molde
// do `InUseBlockedDialog` genérico (TASK-CT-03c, migração de
// `ContadorInUseDialog.tsx`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';

const labels = (languageGB: LanguageDate): Map<string, string> =>
  new Map([
    ['contador_issue', languageGB.contadores.contador.deleteBlocked.tableLabels.contador_issue],
    ['cash_books', languageGB.contadores.contador.deleteBlocked.tableLabels.cash_books],
    [
      'integration_dominios',
      languageGB.contadores.contador.deleteBlocked.tableLabels.integration_dominios,
    ],
  ]);

// Fallback defensivo: só ativa se a API devolver uma chave nunca vista (nome
// cru da tabela) — mesmo racional de `addressingInUseTableLabels`.
const getLabel = (table: string, languageGB: LanguageDate): string =>
  labels(languageGB).get(table) ?? table;

export const contadorInUseTableLabels = { getLabel };
