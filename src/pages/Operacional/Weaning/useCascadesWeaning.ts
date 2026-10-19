// src/pages/Operacional/Weaning/useCascadesWeaning.ts
// -----------------------------------------------------------------------------
// Cascata de seleção do form de Desmama — TASK-WN-FE-04 (IG-01). Mirror do
// racional já usado em `Operacional/Pastagem/useCascadesPastagem.ts`.
//
// Cascata implementada:
//   - `batch_uuid → animal_uuids` — troca de Lote limpa a seleção de
//     Animais (mães): o servidor não garante que as mães do lote anterior
//     ainda sejam elegíveis no lote novo (`LookupAnimalsForWeaningAction`
//     real filtra por `batch_uuid`).
//
// GAP-PAST-FE-01 (herdada, mesma lacuna já registrada para Pastagem/
// Nascimentos) — o retrigger por `date` (`check-date`) NÃO foi
// implementado: endpoint confirmado ausente no fork da API. Nenhuma
// simulação foi criada em seu lugar (SEM MOCK).
// -----------------------------------------------------------------------------

import type { WeaningForm } from '@/@types/v2/Weaning';

import type { UseFormSetValue } from 'react-hook-form';

interface UseCascadesWeaningProps {
  setValue: UseFormSetValue<WeaningForm>;
}

export function useCascadesWeaning({ setValue }: UseCascadesWeaningProps) {
  /** Lote trocado — Animais (mães) selecionadas podem não pertencer ao
   *  novo lote. */
  function handleBatchChange() {
    setValue('animal_uuids', [], { shouldDirty: true });
  }

  return { handleBatchChange };
}
