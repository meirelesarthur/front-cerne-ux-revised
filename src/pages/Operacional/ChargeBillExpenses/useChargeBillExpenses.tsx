// src/pages/Operacional/ChargeBillExpenses/useChargeBillExpenses.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo "Contas a Pagar" (ChargeBillExpense — Operacional /
// Agricultura / Carregamento). TASK-CBE-05/TASK-CBE-07, esteira
// 97-Esteiras/062. Mirror ESTRUTURAL de
// `Operacional/ChargeBillIncomes/useChargeBillIncomes.tsx` (gêmeo):
//   - useChargeBillExpensesList → useCustomGridQuery (listagem paginada REAL
//     de servidor). SEM ID de contexto (mirror exato do gêmeo — NÃO usar
//     useCustomGridQueryById). SEM filtro (fiel ao legado, FILT-01) —
//     `filterQuery: []`, `filter: {}`.
//   - useChargeBillExpenseDetail → hidratação por uuid (TASK-CBE-07), mirror
//     `useChargeBillIncomeDetail` (`useCustomFormQueryByGuid`, NÃO
//     `useCustomFormQueryById` — o id desta entidade é sempre GUID).
//     `fillForm` é um NO-OP (`() => undefined`) — a tela de detalhe é 100%
//     read-only, SEM `useForm`/RHF/`reset()`.
//
// Sem Zustand — paginação por `userPaginatedQuery` (Contexto React), dados de
// servidor só no TanStack Query.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getChargeBillExpenseByUuid,
  listChargeBillExpenses,
} from '@/services/v2/ChargeBillExpense/charge-bill-expense-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  ChargeBillExpenseDetail,
  ChargeBillExpenseListItem,
} from '@/@types/v2/ChargeBillExpense';

interface UseChargeBillExpensesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
}

export function useChargeBillExpensesList({
  paginatedQuery,
  setPaginatedQuery,
}: UseChargeBillExpensesListProps) {
  return useCustomGridQuery<ChargeBillExpenseListItem, Record<string, never>>({
    asyncFunction: listChargeBillExpenses,
    queryKey: queryKey.chargeBillExpenses.chargeBillExpensesList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: {},
  });
}

// `GET /charge-bill-expenses/{uuid}` — tela de Detalhe (TASK-CBE-07). uuid
// malformado/ausente nunca dispara a query (`isValidGuid` interno do hook).
export function useChargeBillExpenseDetail(chargeBillExpenseUuid: string | undefined) {
  return useCustomFormQueryByGuid<ChargeBillExpenseDetail>({
    registrationId: chargeBillExpenseUuid,
    asyncFunction: getChargeBillExpenseByUuid,
    fillForm: () => undefined,
    queryKey: queryKey.chargeBillExpenses.chargeBillExpense,
  });
}
