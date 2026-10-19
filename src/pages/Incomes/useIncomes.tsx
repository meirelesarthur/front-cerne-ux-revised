// src/pages/Incomes/useIncomes.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo de CONTAS A RECEBER (Income) — mirror estrutural
// de `CentroCusto/useCostCenters.tsx`:
//   - useIncomesList   → useCustomGridQuery (listagem paginada + filtros, TASK-FE-036-311)
//   - useIncomeForm    → useCustomFormQueryByGuid (hidratação do form de create/update, TASK-FE-036-313)
//   - useIncomeDetail  → useQuery direto (tela de Detalhe somente-leitura, TASK-FE-036-317 — mirror
//     `useInvoiceDetail.tsx`, sem RHF nenhum, só leitura)
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';

import { getIncome, listIncomes } from '@/services/v2/Incomes/income-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type { IncomeDetail, IncomeFilterForm, IncomeListItem } from '@/@types/v2/Incomes';

interface UseIncomesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
  filter?: IncomeFilterForm;
}

// Listagem paginada de parcelas de Income — cada LINHA é UMA PARCELA (§3.2 do
// contrato), não um "título" agregando N parcelas.
export function useIncomesList({ paginatedQuery, setPaginatedQuery, filter }: UseIncomesListProps) {
  return useCustomGridQuery<IncomeListItem, IncomeFilterForm>({
    asyncFunction: listIncomes,
    queryKey: queryKey.incomes.incomes,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: filter ?? ({} as IncomeFilterForm),
  });
}

interface UseIncomeFormProps {
  registrationId?: string;
  fillForm: (data: IncomeDetail, resetForce?: boolean) => void;
}

// Query de detalhe para preencher o formulário de edição (TASK-FE-036-313) —
// hidrata `is_locked`/`categories` (rateio), mirror `useCostCenterForm`.
export function useIncomeForm({ registrationId, fillForm }: UseIncomeFormProps) {
  return useCustomFormQueryByGuid<IncomeDetail>({
    registrationId,
    queryKey: queryKey.incomes.income,
    asyncFunction: getIncome,
    fillForm,
  });
}

// Tela de Detalhe somente-leitura (TASK-FE-036-317) — useQuery DIRETO (sem
// RHF), mirror `useInvoiceDetail.tsx`.
export function useIncomeDetail(incomeUuid: string | undefined) {
  return useQuery({
    queryKey: [queryKey.incomes.income, incomeUuid],
    queryFn: async () => {
      if (!incomeUuid) throw new Error('uuid inválido');
      const response = await getIncome(incomeUuid);
      return response.data;
    },
    enabled: isValidGuid(incomeUuid),
    retry: false,
  });
}
