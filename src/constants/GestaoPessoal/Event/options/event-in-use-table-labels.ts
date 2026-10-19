// src/constants/GestaoPessoal/Event/options/event-in-use-table-labels.ts
// -----------------------------------------------------------------------------
// Dicionário de rótulos de exibição para as chaves reais de `errors.in_use`
// (`DeleteEventAction`/`EventRepository::dependencyUsageCounts()`, api_root)
// — mapa `{tabela: count}`, NÃO `Array<{resource, table, count}>`. Mesmo
// padrão `(languageGB) => Map` de `functionInUseTableLabels`/
// `parameterWeightInUseTableLabels`, mas aqui com 5 entradas — o maior fan-in
// do projeto até aqui (contrato de API §6): `earning_event`,
// `employee_events`, `absences`, `bonuses`, `advances`.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';

const labels = (languageGB: LanguageDate): Map<string, string> => {
  const text = languageGB.events.event.deleteBlocked.tableLabels;
  return new Map([
    ['earning_event', text.earning_event],
    ['employee_events', text.employee_events],
    ['absences', text.absences],
    ['bonuses', text.bonuses],
    ['advances', text.advances],
  ]);
};

// Fallback defensivo: só ativa se a API devolver uma 6ª chave nunca vista
// (nome cru da tabela) — não deve acontecer em uso normal, mas evita quebrar
// a tela silenciosamente caso o backend adicione uma nova FK dependente sem
// o dicionário ser atualizado em conjunto.
const getLabel = (table: string, languageGB: LanguageDate): string =>
  labels(languageGB).get(table) ?? table;

export const eventInUseTableLabels = { getLabel };
