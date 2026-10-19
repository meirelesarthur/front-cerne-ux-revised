// src/pages/Operacional/ChargeBillExpenses/useChargeBillExpenseForm.tsx
// -----------------------------------------------------------------------------
// Hook de query do FORMULÁRIO de Contas a Pagar (ChargeBillExpense) —
// TASK-CBE-06, esteira 97-Esteiras/062. Arquivo distinto de
// `useChargeBillExpenses.tsx` (listagem, TASK-CBE-05, já existente nesta
// mesma pasta) — mirror ESTRUTURAL 1:1 de
// `Operacional/ChargeBillIncomes/useChargeBillIncomeForm.tsx` (gêmeo).
//
// `useCustomFormQueryByGuid` — padrão DOMINANTE do fork (mirror do gêmeo,
// mesmo contrato funcional `fillForm(data, resetForce)`, Lei 2).
// -----------------------------------------------------------------------------

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';

import { queryKey } from '@/constants/query-key';

import { getChargeBillExpenseByUuid } from '@/services/v2/ChargeBillExpense/charge-bill-expense-service';

import type { ChargeBillExpenseDetail } from '@/@types/v2/ChargeBillExpense';

interface UseChargeBillExpenseFormProps {
  registrationId?: string;
  fillForm: (data: ChargeBillExpenseDetail, resetForce?: boolean) => void;
}

export function useChargeBillExpenseForm({
  registrationId,
  fillForm,
}: UseChargeBillExpenseFormProps) {
  return useCustomFormQueryByGuid<ChargeBillExpenseDetail>({
    registrationId,
    queryKey: queryKey.chargeBillExpenses.chargeBillExpense,
    asyncFunction: getChargeBillExpenseByUuid,
    fillForm,
  });
}
