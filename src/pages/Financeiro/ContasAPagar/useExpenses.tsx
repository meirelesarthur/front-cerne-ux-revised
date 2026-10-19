// src/pages/Financeiro/ContasAPagar/useExpenses.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de Expense (Contas a Pagar, esteira 036) — mesmo
// padrão de `Invoices/useInvoices.tsx`:
//   - useExpensesList → useCustomGridQuery (listagem paginada + filtros,
//     TASK-FE-036-102)
//   - useExpenseForm  → useCustomFormQueryByGuid (detalhe p/ formulário,
//     TASK-FE-036-104)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import { getExpense, listExpenses } from '@/services/v2/Financeiro/Expenses/expense-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  ExpenseDetail,
  ExpenseFilterForm,
  ExpenseListItem,
} from '@/@types/v2/Financeiro/expense';

interface UseExpensesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: ExpenseFilterForm;
}

export function useExpensesList({
  paginatedQuery,
  setPaginatedQuery,
  filter,
}: UseExpensesListProps) {
  return useCustomGridQuery<ExpenseListItem, ExpenseFilterForm>({
    asyncFunction: listExpenses,
    queryKey: queryKey.expenses.list,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as ExpenseFilterForm),
  });
}

interface UseExpenseFormProps {
  registrationId?: string;
  fillForm: (data: ExpenseDetail, resetForce?: boolean) => void;
}

export function useExpenseForm({ registrationId, fillForm }: UseExpenseFormProps) {
  return useCustomFormQueryByGuid<ExpenseDetail>({
    registrationId,
    queryKey: queryKey.expenses.detail,
    asyncFunction: getExpense,
    fillForm,
  });
}
