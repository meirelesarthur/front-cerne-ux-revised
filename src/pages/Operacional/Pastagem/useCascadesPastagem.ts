// src/pages/Operacional/Pastagem/useCascadesPastagem.ts
// -----------------------------------------------------------------------------
// Cascatas de seleção da aba Geral do form de Pastagem — TASK-PAST-FE-03
// (IG-01..06). Mirror do racional já usado em
// `Appropriations/AppropriationHeaderFields.tsx` (operation→activity) e
// `AppropriationLaborTab.tsx`/`AppropriationStockTab.tsx` (limpeza de
// campos dependentes ao trocar o campo pai).
//
// Cascatas implementadas:
//   - `operation_uuid → activity_uuid` — troca de Operação limpa Atividade
//     (Activity filtrada por `operation_id`, id numérico embutido na
//     option de Operação).
//   - `area_uuid XOR grazing_uuid → batch_uuid → animal_uuid` — Área e
//     Módulo de Pastejo são mutuamente exclusivos (schema, DEC-FE-09);
//     trocar QUALQUER um dos dois limpa Lote; trocar Lote limpa Animal
//     (`listAnimals({ batch: batchUuid })`).
//
// GAP-PAST-FE-01 — o retrigger por `date` (`check-date`, RT-11) NÃO foi
// implementado: endpoint confirmado ausente no fork da API. Nenhuma
// simulação foi criada em seu lugar (SEM MOCK).
// -----------------------------------------------------------------------------

import type { PastureForm } from '@/@types/v2/Pastures';

import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';

interface UseCascadesPastagemProps {
  watch: UseFormWatch<PastureForm>;
  setValue: UseFormSetValue<PastureForm>;
}

export function useCascadesPastagem({ setValue }: UseCascadesPastagemProps) {
  /** Operação trocada — Atividade pode não pertencer à nova Operação. */
  function handleOperationChange() {
    setValue('activity_uuid', null);
  }

  /** Área selecionada — limpa Módulo de Pastejo (XOR) + Lote/Animal
   *  dependentes (fidelidade — mirror `handleGrazingChange`). */
  function handleAreaChange() {
    setValue('grazing_uuid', null);
    setValue('batch_uuid', null);
    setValue('animal_uuid', null);
  }

  /** Módulo de Pastejo selecionado — limpa Área (XOR) + Lote/Animal. */
  function handleGrazingChange() {
    setValue('area_uuid', null);
    setValue('batch_uuid', null);
    setValue('animal_uuid', null);
  }

  /** Lote trocado — Animal pode não pertencer ao novo Lote. */
  function handleBatchChange() {
    setValue('animal_uuid', null);
  }

  return {
    handleOperationChange,
    handleAreaChange,
    handleGrazingChange,
    handleBatchChange,
  };
}
