// src/constants/Fiscal/accountingEntry/accountingEntry-item-condition.ts
// Enum de Condição (Débito/Crédito) da LINHA do lançamento (`EntryItem` —
// Partida Dobrada, F-128, esteira 97-Esteiras/068, TASK-PD-FE-03). Enum NOVO,
// distinto de `PlanAccountCondition` (natureza da conta, módulo Plano de
// Contas, que pode ter "Ambos") — domínios DIFERENTES (CLM-14). Só 2 casos,
// NUNCA adicionar um 3º "Ambos" (dead path — contrato-tela §4/§5, FID-G3F
// FLD-13/CLM-15; servidor rejeita `condition:3` com 422 `in:1,2`).

import { AccountingEntryItemCondition } from '@/@types/v2/Fiscal/accountingEntry';

export const accountingEntryItemCondition = {
  debit: 1,
  credit: 2,
} as const satisfies Record<'debit' | 'credit', AccountingEntryItemCondition>;

export const accountingEntryItemConditionColor: Record<AccountingEntryItemCondition, string> = {
  1: 'red',
  2: 'green',
};
