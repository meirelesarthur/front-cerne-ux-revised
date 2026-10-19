// src/constants/ParameterWeight/options/parameter-weight-in-use-table-labels.ts
// -----------------------------------------------------------------------------
// Dicionário de rótulos de exibição para as chaves reais de `errors.in_use`
// (`DeleteParameterWeightAction`/`ParameterWeightRepository::dependencyUsageCounts()`,
// api_root) — mapa `{tabela: count}`, NÃO `Array<{resource, table, count}>`.
// Mesma família de Action de `Marker`/`AdditionalInfo`/`NatureOperation`, não
// a família `hasDependents()` de `Contador` (que monta `resource` no PHP).
//
// Hoje só existe 1 FK possível (`batches`, confirmado por leitura direta do
// Action) — a fábrica é genérica (`(languageGB) => Map`, mesmo padrão de
// `markerInUseTableLabels`) para não quebrar se uma 2ª FK for adicionada no
// futuro sem o dicionário acompanhar.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';

const labels = (languageGB: LanguageDate): Map<string, string> =>
  new Map([
    ['batches', languageGB.baseRegistrations.parameterWeight.deleteBlocked.tableLabels.batches],
  ]);

// Fallback defensivo: só ativa se a API devolver uma 2ª chave nunca vista
// (nome cru da tabela) — mesmo racional de `markerInUseTableLabels`.
const getLabel = (table: string, languageGB: LanguageDate): string =>
  labels(languageGB).get(table) ?? table;

export const parameterWeightInUseTableLabels = { getLabel };
