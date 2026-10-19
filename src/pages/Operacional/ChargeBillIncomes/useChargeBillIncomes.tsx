// src/pages/Operacional/ChargeBillIncomes/useChargeBillIncomes.tsx
// -----------------------------------------------------------------------------
// Hooks de query do módulo "Contas a Receber" (ChargeBillIncome — Operacional /
// Agricultura / Carregamento). Mirror estrutural de
// `Operacional/FechamentoSemana/useFechamentoSemana.tsx`:
//   - useChargeBillIncomesList → useCustomGridQuery (listagem paginada REAL de
//     servidor, TASK-CBI-FE-02). SEM filtro (fiel ao legado, FILT-01) —
//     `filterQuery: []`, `filter: {}`.
//   - useChargeBillIncomeDetail → hidratação por uuid (TASK-CBI-FE-04), mirror
//     `useClosingWeekDetail` (`useCustomFormQueryByGuid`, NÃO
//     `useCustomFormQueryById` — o id desta entidade é sempre GUID).
//     `fillForm` é um NO-OP (`() => undefined`) — a tela de detalhe é 100%
//     read-only, SEM `useForm`/RHF/`reset()` (contrato de tela §5).
//
// Sem Zustand — paginação por `userPaginatedQuery` (Contexto React), dados de
// servidor só no TanStack Query.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';

import { queryKey } from '@/constants/query-key';

import {
  getChargeBillIncomeByUuid,
  listChargeBillIncomes,
} from '@/services/v2/ChargeBillIncome/charge-bill-income-service';

import type { PaginatedQueryProps } from '@/@types/pagination';
import type {
  ChargeBillIncomeDetail,
  ChargeBillIncomeListItem,
} from '@/@types/v2/ChargeBillIncome';

interface UseChargeBillIncomesListProps {
  paginatedQuery: PaginatedQueryProps;
  setPaginatedQuery: Dispatch<SetStateAction<PaginatedQueryProps<any>>>;
}

export function useChargeBillIncomesList({
  paginatedQuery,
  setPaginatedQuery,
}: UseChargeBillIncomesListProps) {
  return useCustomGridQuery<ChargeBillIncomeListItem, Record<string, never>>({
    asyncFunction: listChargeBillIncomes,
    queryKey: queryKey.chargeBillIncomes.chargeBillIncomesList,
    paginatedQuery,
    setPaginatedQuery,
    filterQuery: [],
    filter: {},
  });
}

// `GET /charge-bill-incomes/{uuid}` — tela de Detalhe (TASK-CBI-FE-04). uuid
// malformado/ausente nunca dispara a query (`isValidGuid` interno do hook).
export function useChargeBillIncomeDetail(chargeBillIncomeUuid: string | undefined) {
  return useCustomFormQueryByGuid<ChargeBillIncomeDetail>({
    registrationId: chargeBillIncomeUuid,
    asyncFunction: getChargeBillIncomeByUuid,
    fillForm: () => undefined,
    queryKey: queryKey.chargeBillIncomes.chargeBillIncome,
  });
}
