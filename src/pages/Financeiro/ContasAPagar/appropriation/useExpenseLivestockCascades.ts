// src/pages/Financeiro/ContasAPagar/appropriation/useExpenseLivestockCascades.ts
// -----------------------------------------------------------------------------
// UT-000795 — cascatas do bloco Pecuária de Contas a Pagar (molde
// `Operacional/Pastagem/useCascadesPastagem.ts`, com a diferença deliberada do
// legado C-06/C-07: Área/Módulo só limpam o OUTRO quando a nova escolha TEM
// valor; se foi limpa, o outro não é tocado).
//
//   Área muda   → limpa Lote e Animal; com valor, limpa Módulo (XOR).
//   Módulo muda → limpa Lote e Animal; com valor, limpa Área (XOR).
//   Lote muda   → limpa Animal.
//   Operação muda → limpa Atividade.
//
// REGRA DE OURO: estes handlers só rodam dentro do `onChange` do Select
// (evento do usuário). `reset()` do RHF não dispara `onChange`, logo a
// hidratação da edição nunca limpa Lote/Animal/Atividade gravados. PROIBIDO
// `useEffect` que limpe por dependência de Área/Módulo/Lote/Operação.
// -----------------------------------------------------------------------------

import type { PaginationQueryParams } from '@/@types/pagination';
import type { ExpenseForm } from '@/@types/v2/Financeiro/expense';

import {
  listLivestockAnimalOptions,
  listLivestockBatchOptions,
} from './expenseAppropriationServices';

import type { UseFormClearErrors, UseFormGetValues, UseFormSetValue } from 'react-hook-form';

interface UseExpenseLivestockCascadesProps {
  setValue: UseFormSetValue<ExpenseForm>;
  getValues: UseFormGetValues<ExpenseForm>;
  clearErrors: UseFormClearErrors<ExpenseForm>;
}

type LivestockField =
  | 'aprop_pec_area_uuid'
  | 'aprop_pec_grazing_uuid'
  | 'aprop_pec_batch_uuid'
  | 'aprop_pec_animal_uuid'
  | 'aprop_pec_operation_uuid'
  | 'aprop_pec_activity_uuid';

export function useExpenseLivestockCascades({
  setValue,
  getValues,
  clearErrors,
}: UseExpenseLivestockCascadesProps) {
  function clearField(name: LivestockField) {
    setValue(name, null, { shouldDirty: true });
    clearErrors(name);
  }

  function handleAreaChange(hasValue: boolean) {
    clearErrors('aprop_pec_area_uuid');
    clearField('aprop_pec_batch_uuid');
    clearField('aprop_pec_animal_uuid');
    if (hasValue) clearField('aprop_pec_grazing_uuid');
  }

  function handleGrazingChange(hasValue: boolean) {
    clearErrors('aprop_pec_grazing_uuid');
    clearField('aprop_pec_batch_uuid');
    clearField('aprop_pec_animal_uuid');
    if (hasValue) clearField('aprop_pec_area_uuid');
  }

  function handleBatchChange() {
    clearErrors('aprop_pec_batch_uuid');
    clearField('aprop_pec_animal_uuid');
  }

  function handleOperationChange() {
    clearErrors('aprop_pec_operation_uuid');
    clearField('aprop_pec_activity_uuid');
  }

  // Lote por Área OU Módulo, lidos no momento da chamada. Sem pai: não chama a API.
  function listBatchOptions(params: PaginationQueryParams & { search?: string }) {
    return listLivestockBatchOptions({
      search: params.search,
      areaUuid: getValues('aprop_pec_area_uuid')?.value ?? null,
      grazingUuid: getValues('aprop_pec_grazing_uuid')?.value ?? null,
    });
  }

  // Animal por Lote, lido no momento da chamada. Sem Lote: não chama a API.
  function listAnimalOptions(params: PaginationQueryParams & { search?: string }) {
    return listLivestockAnimalOptions({
      ...params,
      batchUuid: getValues('aprop_pec_batch_uuid')?.value ?? null,
    });
  }

  return {
    handleAreaChange,
    handleGrazingChange,
    handleBatchChange,
    handleOperationChange,
    listBatchOptions,
    listAnimalOptions,
  };
}
