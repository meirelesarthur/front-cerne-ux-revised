// src/constants/animalFazenda/transferAnimalFarm/options/transfer-animal-farm-status-options.ts
// Fábrica de options de status de Transferência de Animal entre Fazendas —
// TASK-FE-042-101. Padrão canônico `(languageGB) => Map` + `getLabel`/
// `getOption`/`options`, mirror `account-status.ts`/`provider-type-options.ts`.

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { TransferAnimalFarmStatusValue } from '@/@types/v2/Operacional/AnimalFazenda/transferAnimalFarm';

import { transferAnimalFarmStatus } from '../transfer-animal-farm-status';

const statusLabels = (languageGB: LanguageDate): Map<TransferAnimalFarmStatusValue, string> => {
  const statusText = languageGB.animalFazenda.transferAnimalFarm.status;
  return new Map([
    [transferAnimalFarmStatus.pending, statusText.pending],
    [transferAnimalFarmStatus.processing, statusText.processing],
    [transferAnimalFarmStatus.finished, statusText.finished],
    [transferAnimalFarmStatus.canceled, statusText.canceled],
  ]);
};

const getStatusLabel = (status: TransferAnimalFarmStatusValue, languageGB: LanguageDate): string =>
  statusLabels(languageGB).get(status)!;

const getStatusOption = (
  status: TransferAnimalFarmStatusValue,
  languageGB: LanguageDate
): Option<TransferAnimalFarmStatusValue> => ({
  label: getStatusLabel(status, languageGB),
  value: status,
});

const statusOptions = (languageGB: LanguageDate): Option<TransferAnimalFarmStatusValue>[] =>
  Array.from(statusLabels(languageGB)).map(([value, label]) => ({ value, label }));

export const transferAnimalFarmStatusOptions = {
  getLabel: getStatusLabel,
  getOption: getStatusOption,
  options: statusOptions,
};
