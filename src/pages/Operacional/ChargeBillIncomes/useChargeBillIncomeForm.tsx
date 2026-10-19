// src/pages/Operacional/ChargeBillIncomes/useChargeBillIncomeForm.tsx
// -----------------------------------------------------------------------------
// Hook de query do FORMULÁRIO de Contas a Receber (ChargeBillIncome) —
// TASK-CBI-FE-03, esteira 97-Esteiras/059. Arquivo distinto de
// `useChargeBillIncomes.tsx` (listagem, TASK-CBI-FE-02, já existente nesta
// mesma pasta) — mirror `CadastrosBase/EstoqueInicial/useOpeningBalanceForm.tsx`
// (mesma separação list-hook/form-hook).
//
// `useCustomFormQueryByGuid` — padrão DOMINANTE do fork (145 usos em
// `src/pages` vs 30 de `useCustomFormQueryById`; a própria doc do hook diz
// "padrão da empresa para projetos novos"). O `useCustomFormQueryById` citado
// no roteiro da Tarefa é o nome GENÉRICO do `get_pwa_form_query_pattern`
// (Hook 2, `registrationId` UUID) — mesmo contrato funcional
// (`fillForm(data, resetForce)`, Lei 2), nome real do fork é `ByGuid`.
// -----------------------------------------------------------------------------

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';

import { queryKey } from '@/constants/query-key';

import { getChargeBillIncomeByUuid } from '@/services/v2/ChargeBillIncome/charge-bill-income-service';

import type { ChargeBillIncomeDetail } from '@/@types/v2/ChargeBillIncome';

interface UseChargeBillIncomeFormProps {
  registrationId?: string;
  fillForm: (data: ChargeBillIncomeDetail, resetForce?: boolean) => void;
}

export function useChargeBillIncomeForm({
  registrationId,
  fillForm,
}: UseChargeBillIncomeFormProps) {
  return useCustomFormQueryByGuid<ChargeBillIncomeDetail>({
    registrationId,
    queryKey: queryKey.chargeBillIncomes.chargeBillIncome,
    asyncFunction: getChargeBillIncomeByUuid,
    fillForm,
  });
}
