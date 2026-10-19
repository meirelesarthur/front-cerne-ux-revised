// src/pages/Operacional/Pesagem/useWeighingDateConflicts.ts
// -----------------------------------------------------------------------------
// Regra de data da pesagem (decisão do dono, 2026-10-08 — aplicada pela API):
// a data precisa ser ESTRITAMENTE posterior à última pesagem do animal; sem
// pesagem anterior, igual ou posterior à data de entrada.
//
// Este hook é a única camada que conversa com `GET /weighings/check-date` para
// a tela inteira (adaptação da API isolada aqui). Dispara UMA chamada, com
// debounce, quando muda a data / lote / categoria (ou a pesagem em edição),
// levando TODOS os animais já escolhidos (`animal_uuids[]` + `weighing_uuid`
// na edição). Resultado:
//   - `conflicts`: mapa `animal uuid -> { label, reference_date, reason, message }`
//     dos `invalid_animals[]` (a linha exibe o `message` da API, que já traz a
//     data; `reason` é só código — `last_weighing|next_weighing|entry_date`). Os animais NÃO são removidos — a linha é marcada
//     com erro (ver `WeighingAnimalRow`) e o Salvar fica bloqueado
//     (`hasConflicts`) até corrigir a data ou trocar/remover o animal;
//   - sem animais na lista, `valid=false` segue como aviso informativo (toast)
//     do cabeçalho, como antes;
//   - erro de rede/422 é silencioso (não trava a tela) e limpa o estado.
// A lista de animais é lida por ref no disparo (a escolha de um animal já é
// validada individualmente no `handleAnimalChange` da linha — não duplica
// chamada). `hasConflicts` considera só animais AINDA presentes na lista: ao
// trocar/remover o animal o erro some sem nova chamada.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';

import { Control, useWatch } from 'react-hook-form';

import { toaster } from '@/components/ui/toaster';

import { checkWeighingDate } from '@/services/v2/Weighing/weighing-service';

import type { LanguageDate } from '@/@types/language';
import type { CheckWeighingDateInvalidAnimal, WeighingFormValues } from '@/@types/v2/Weighing';

export type WeighingDateConflicts = Record<string, CheckWeighingDateInvalidAnimal>;

const DEBOUNCE_MS = 400;

interface UseWeighingDateConflictsParams {
  control: Control<WeighingFormValues>;
  weighingUuid?: string;
  languageGB: LanguageDate;
}

export function useWeighingDateConflicts({
  control,
  weighingUuid,
  languageGB,
}: UseWeighingDateConflictsParams) {
  const watchedDate = useWatch({ control, name: 'date' });
  const watchedBatch = useWatch({ control, name: 'batch_uuid' });
  const watchedCategory = useWatch({ control, name: 'category_uuid' });
  const watchedAnimals = useWatch({ control, name: 'animals' });

  const batchUuid = watchedBatch?.value;
  const categoryUuid = watchedCategory?.value;

  const selectedUuids = useMemo(
    () =>
      (watchedAnimals ?? [])
        .map((animal) => animal?.animal_uuid?.value)
        .filter((uuid): uuid is string => !!uuid),
    [watchedAnimals]
  );

  const selectedUuidsRef = useRef<string[]>(selectedUuids);
  selectedUuidsRef.current = selectedUuids;

  const [rawConflicts, setRawConflicts] = useState<WeighingDateConflicts>({});

  useEffect(() => {
    if (!watchedDate || (!batchUuid && !categoryUuid)) {
      setRawConflicts({});
      return undefined;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      const animalUuids = [...new Set(selectedUuidsRef.current)];

      checkWeighingDate({
        date: watchedDate,
        batch_uuid: batchUuid,
        category_uuid: categoryUuid,
        animal_uuids: animalUuids.length ? animalUuids : undefined,
        weighing_uuid: weighingUuid,
      })
        .then((response) => {
          if (cancelled) return;
          const invalid = response.data?.invalid_animals ?? [];
          setRawConflicts(Object.fromEntries(invalid.map((item) => [item.uuid, item])));

          // Sem animais na lista (aviso do cabeçalho) ou aviso de lote sem
          // animal apontado: toast informativo, como antes.
          if (response.data?.valid === false && invalid.length === 0) {
            toaster.create({
              type: 'warning',
              title: languageGB.weighing.weighing.singularLabel,
              description: response.data.message ?? undefined,
            });
          }
        })
        .catch(() => {
          // não-bloqueante — silencioso; não deixa conflito obsoleto bloqueando o Salvar.
          if (!cancelled) setRawConflicts({});
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [watchedDate, batchUuid, categoryUuid, weighingUuid]);

  // Só vale para animais ainda na lista (trocar/remover o animal limpa o erro).
  const conflicts = useMemo<WeighingDateConflicts>(() => {
    const present = new Set(selectedUuids);
    return Object.fromEntries(Object.entries(rawConflicts).filter(([uuid]) => present.has(uuid)));
  }, [rawConflicts, selectedUuids]);

  return { conflicts, hasConflicts: Object.keys(conflicts).length > 0 };
}

export default useWeighingDateConflicts;
