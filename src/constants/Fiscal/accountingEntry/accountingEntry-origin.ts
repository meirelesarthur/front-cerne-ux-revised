// src/constants/Fiscal/accountingEntry/accountingEntry-origin.ts
// Enum de Origem do lançamento (Partida Dobrada — AccountingEntry, F-128,
// esteira 97-Esteiras/068, TASK-PD-FE-03). 3 valores fixos definidos pelo
// backend (`AccountingEntryOrigin`), sem "Selecione" embutido (placeholder é
// decisão de UI do Select, não do enum). Badge de cor na grid — mirror
// contrato-tela §6/`get_pwa_constants_and_mappers_pattern §12.6-bis`.

export const accountingEntryOrigin = {
  administrative: 'A',
  agriculture: 'G',
  livestock: 'P',
} as const;

export const accountingEntryOriginColor: Record<string, string> = {
  A: 'blue',
  G: 'green',
  P: 'orange',
};
