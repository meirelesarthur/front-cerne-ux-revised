// src/constants/loteFazenda/transferBatchFarm/transfer-batch-farm-status.ts
// Enum `TransferBatchFarmStatus` (mirror `App\Enums\TransferBatchFarmStatus`,
// GB.Cerne.Api, TASK-BE-041-LF-01) + mapa de cor CO-LOCADO, espelhando
// `TransferBatchFarmStatus::color()`. 1=Em Aberto, 2=Em Processamento,
// 3=Finalizado, 4=Cancelado.

import type { TransferBatchFarmStatusValue } from '@/@types/v2/LoteFazenda/transferBatchFarm';

export const transferBatchFarmStatus = {
  pending: 1,
  processing: 2,
  finished: 3,
  canceled: 4,
} as const satisfies Record<string, TransferBatchFarmStatusValue>;

// Cores literais mirror EXATO do backend (`TransferBatchFarmStatus::color()`)
// — não hex arbitrário do front.
export const transferBatchFarmStatusColor: Record<TransferBatchFarmStatusValue, string> = {
  [transferBatchFarmStatus.pending]: '#b1b1b1',
  [transferBatchFarmStatus.processing]: '#ff9900',
  [transferBatchFarmStatus.finished]: '#1cc872',
  [transferBatchFarmStatus.canceled]: '#ff0000',
};
