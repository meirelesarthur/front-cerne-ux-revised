// src/constants/Fodder/options/fodder-in-use-table-labels.ts
// -----------------------------------------------------------------------------
// Dicionário de rótulos de exibição para as chaves reais de `errors.in_use`
// (`DeleteFodderAction`/`FodderRepository::dependencyUsageCounts()`,
// Fodder-contrato.md §4.6/DA-FD-04) — mapa `{tabela: count}`, NÃO
// `Array<{resource, table, count}>`. Mesma família de Action de
// `ParameterWeight`/`Marker`/`AdditionalInfo`/`NatureOperation`.
//
// Hoje só existe 1 FK possível (`grazings`, `Grazing`/"Pastejo", módulo NÃO
// migrado — o acoplamento do repositório com o nome físico da tabela é débito
// técnico rastreável, `Fodder-contrato.md` DA-FD-04) — a fábrica é genérica
// (`(languageGB) => Map`, mesmo padrão de `parameterWeightInUseTableLabels`)
// para não quebrar se uma 2ª FK for adicionada no futuro sem o dicionário
// acompanhar.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';

const labels = (languageGB: LanguageDate): Map<string, string> =>
  new Map([['grazings', languageGB.baseRegistrations.fodder.deleteBlocked.tableLabels.grazings]]);

// Fallback defensivo: só ativa se a API devolver uma 2ª chave nunca vista
// (nome cru da tabela) — mesmo racional de `parameterWeightInUseTableLabels`.
const getLabel = (table: string, languageGB: LanguageDate): string =>
  labels(languageGB).get(table) ?? table;

export const fodderInUseTableLabels = { getLabel };
