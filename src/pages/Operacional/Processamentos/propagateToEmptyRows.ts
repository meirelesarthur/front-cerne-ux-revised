// src/pages/Operacional/Processamentos/propagateToEmptyRows.ts
// -----------------------------------------------------------------------------
// Função utilitária PURA (testável isoladamente, sem precisar montar o form
// inteiro) — TASK-FE-039-PROC-08 (resolve gap #8). Mirror
// `_card_animal.blade.php:179-263` (`handleBatch`/`handleCategoryMatrice`/
// `handleBreed`, todos com a mesma condição `.nextAll()...if (!$select.val())`):
// ao mudar UM campo NESTA linha, propaga o mesmo valor para as linhas
// SEGUINTES cujo campo ainda está vazio — NUNCA sobrescreve linha já
// preenchida, NUNCA propaga para trás.
//
// Funciona mesmo com o wizard 1-animal-por-vez (DEC-139): `getValues`/
// `setValue` operam sobre o estado interno do form, independente de qual
// passo está montado no momento (react-hook-form não descarta valores de
// índices não-renderizados, `shouldUnregister` default `false`).
// -----------------------------------------------------------------------------

import type { FinishProcessingForm } from '@/@types/v2/Processamentos/processing';

import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form';

// REWORK (039, round-3, PROC-R3-02) — `reproductive_status` REMOVIDO desta
// união: ALVO A confirma que `handleCategoryMatrice` do legado propaga
// `category_matrice_id` ("Estágio Reprodutivo"), NÃO `reproductive_status`
// ("Status Reprodutivo", que nunca propaga no legado).
type PropagatableFieldName = 'batch_uuid' | 'breed_uuid' | 'category_matrice_uuid';

export function propagateToEmptyRows<TFieldName extends PropagatableFieldName>(
  getValues: UseFormGetValues<FinishProcessingForm>,
  setValue: UseFormSetValue<FinishProcessingForm>,
  totalRows: number,
  currentIndex: number,
  fieldName: TFieldName,
  value: FinishProcessingForm['animals'][number][TFieldName]
): void {
  for (let index = currentIndex + 1; index < totalRows; index += 1) {
    const currentValue = getValues(`animals.${index}.${fieldName}`);
    if (currentValue === null || currentValue === undefined) {
      setValue(`animals.${index}.${fieldName}`, value as any, { shouldDirty: true });
    }
  }
}

// PROC-08 — propagação Compra-only da 1ª identificação (mirror
// `_card_animal.blade.php:381-390`, bloco `#dynamic-form0 .id_animals`,
// dentro do `@if MovementPurchase::class`). Só dispara quando `originType`
// (FQCN do morph, normalizado por `isMovementPurchaseOrigin`) é Compra — fora de Compra, sem propagação de identificação
// (fiel ao legado).
export function propagateFirstIdentificationToEmptyRows(
  getValues: UseFormGetValues<FinishProcessingForm>,
  setValue: UseFormSetValue<FinishProcessingForm>,
  totalRows: number,
  value: FinishProcessingForm['animals'][number]['identifications'][number]['id_animal_uuid']
): void {
  for (let animalIndex = 1; animalIndex < totalRows; animalIndex += 1) {
    const currentValue = getValues(`animals.${animalIndex}.identifications.0.id_animal_uuid`);
    if (currentValue === null || currentValue === undefined) {
      setValue(`animals.${animalIndex}.identifications.0.id_animal_uuid`, value as any, {
        shouldDirty: true,
      });
    }
  }
}
