// src/constants/animalFazenda/transferAnimalFarm/transfer-animal-farm-status.ts
// Enum `TransferAnimalFarmStatus` (mirror `App\Enums\TransferAnimalFarmStatus`,
// GB.Cerne.Api, TASK-BE-042-101) + mapa de cor CO-LOCADO — valores IDÊNTICOS
// a `TransferBatchFarmStatus` (mesma cor, confirmado no contrato de API §5).
// 1=Em Aberto, 2=Em Processamento, 3=Finalizado, 4=Cancelado.

import type { TransferAnimalFarmStatusValue } from '@/@types/v2/Operacional/AnimalFazenda/transferAnimalFarm';

export const transferAnimalFarmStatus = {
  pending: 1,
  processing: 2,
  finished: 3,
  canceled: 4,
} as const satisfies Record<string, TransferAnimalFarmStatusValue>;

// Cores literais mirror EXATO do backend (`TransferAnimalFarmStatus::color()`)
// — não hex arbitrário do front.
export const transferAnimalFarmStatusColor: Record<TransferAnimalFarmStatusValue, string> = {
  [transferAnimalFarmStatus.pending]: '#b1b1b1',
  [transferAnimalFarmStatus.processing]: '#ff9900',
  [transferAnimalFarmStatus.finished]: '#1cc872',
  [transferAnimalFarmStatus.canceled]: '#ff0000',
};
