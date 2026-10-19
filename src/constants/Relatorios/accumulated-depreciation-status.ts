// src/constants/Relatorios/accumulated-depreciation-status.ts
// -----------------------------------------------------------------------------
// Enum de Status (`status`) do relatório de Depreciação Acumulada (Bens/
// Equipamentos — F-216, CONTRATO-F216-depreciacao-acumulada.md §6). Mirror
// ESTRUTURAL de `constants/Inventario/inventario-status.ts` (fábrica
// `(languageGB) => Map` + `getLabel`/`getOption`/`options`), MESMO domínio
// fechado do backend (`App\Enums\EquipmentStatus`):
//   1 = Ativo
//   2 = Inativo
//
// Arquivo MODULAR PRÓPRIO (não reaproveita `inventarioStatusOptions` — aquele
// lê de `languageGB.equipmentInventoryReport.*`, acoplamento cruzado a outro
// módulo de tela). Este lê de `languageGB.accumulatedDepreciationReport.*`
// (i18n modular desta feature, ver `languageAccumulatedDepreciationReport.ts`).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

export const accumulatedDepreciationStatus = {
  active: 1,
  inactive: 2,
} as const;

export type AccumulatedDepreciationStatus =
  (typeof accumulatedDepreciationStatus)[keyof typeof accumulatedDepreciationStatus];

const statusLabels = (languageGB: LanguageDate): Map<AccumulatedDepreciationStatus, string> =>
  new Map([
    [
      accumulatedDepreciationStatus.active,
      languageGB.accumulatedDepreciationReport.report.statusOptions.active,
    ],
    [
      accumulatedDepreciationStatus.inactive,
      languageGB.accumulatedDepreciationReport.report.statusOptions.inactive,
    ],
  ]);

const getLabel = (value: AccumulatedDepreciationStatus, languageGB: LanguageDate): string =>
  statusLabels(languageGB).get(value)!;

const getOption = (
  value: AccumulatedDepreciationStatus,
  languageGB: LanguageDate
): Option<AccumulatedDepreciationStatus> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<AccumulatedDepreciationStatus>[] =>
  Array.from(statusLabels(languageGB)).map(([value, label]) => ({ value, label }));

export const accumulatedDepreciationStatusOptions = { getLabel, getOption, options };
