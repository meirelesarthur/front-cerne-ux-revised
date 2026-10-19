// src/constants/livestock/transferAbcBatch/transferAbcBatch-status.ts
// Enum `TransferAbcType` (mirror `App\Enums\TransferAbcTypeEnum` real,
// GB.Cerne.Api) + mapa de cor CO-LOCADO (`transferAbcTypeColor`), espelhando
// `TransferAbcTypeEnum::color()`. 1 = Entrada (verde), 2 = Saída (vermelho).

import type { TransferAbcType } from '@/@types/v2/Livestock/transferAbcBatch';

export const transferAbcType = {
  entrada: 1,
  saida: 2,
} as const satisfies Record<string, TransferAbcType>;

export const transferAbcTypeColor: Record<TransferAbcType, string> = {
  [transferAbcType.entrada]: 'green',
  [transferAbcType.saida]: 'red',
};
