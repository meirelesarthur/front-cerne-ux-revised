// src/constants/Inventario/inventario-status.ts
// -----------------------------------------------------------------------------
// Enum de Status (`status`) do relatório de Inventário Patrimonial (Bens/
// Equipamentos — F-260, TASK-INV-FE-01, esteira 075). Mirror EXATO de
// `src/constants/cadastrosBase/account/account-status.ts` (fábrica
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`), 2 valores
// fechados mirror `EquipmentStatus` do backend (contrato de API `DA-INV-03`):
//   1 = Ativo
//   2 = Inativo
// `inventarioStatusColor` é sugestão visual co-locada (mirror
// `requestPurchaseStatusColor`), não regra de negócio.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

export const inventarioStatus = {
  active: 1,
  inactive: 2,
} as const;

export type InventarioStatus = (typeof inventarioStatus)[keyof typeof inventarioStatus];

const statusLabels = (languageGB: LanguageDate): Map<InventarioStatus, string> =>
  new Map([
    [inventarioStatus.active, languageGB.equipmentInventoryReport.report.statusOptions.active],
    [
      inventarioStatus.inactive,
      languageGB.equipmentInventoryReport.report.statusOptions.inactive,
    ],
  ]);

const getLabel = (value: InventarioStatus, languageGB: LanguageDate): string =>
  statusLabels(languageGB).get(value)!;

const getOption = (
  value: InventarioStatus,
  languageGB: LanguageDate
): Option<InventarioStatus> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<InventarioStatus>[] =>
  Array.from(statusLabels(languageGB)).map(([value, label]) => ({ value, label }));

export const inventarioStatusOptions = { getLabel, getOption, options };

// Cor do Status (sugestão visual, não regra de negócio — mirror
// `requestPurchaseStatusColor`):
export const inventarioStatusColor: Record<InventarioStatus, string> = {
  1: 'green',
  2: 'gray',
};
