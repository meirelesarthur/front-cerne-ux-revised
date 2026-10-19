// src/constants/relatorios/machines-report/options/maintenance-type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `maintenance_type` (F-278 Máquinas, esteira
// 97-Esteiras/052, TASK-052-278-FE-01) — mirror EXATO de
// `report-format-options.ts` (`Map` alimentado por `languageGB`, domínio
// fixo `'employee' | 'provider'` do enum `MaintenanceType` do backend).
// Selecionar este campo comuta a FONTE do lookup de
// `maintenance_executor_id` (employee↔provider) na tela.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';
import type { MaintenanceType } from '@/@types/v2/MachinesReport';

const labels = (languageGB: LanguageDate): Map<MaintenanceType, string> => {
  const dictionary = languageGB.machinesReport.report.maintenanceTypeOptions;
  return new Map([
    ['employee', dictionary.employee],
    ['provider', dictionary.provider],
  ]);
};

const getLabel = (value: MaintenanceType, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (value: MaintenanceType, languageGB: LanguageDate): Option<MaintenanceType> => ({
  label: getLabel(value, languageGB),
  value,
});

const options = (languageGB: LanguageDate): Option<MaintenanceType>[] =>
  Array.from(labels(languageGB)).map(([value, label]) => ({ label, value }));

export const maintenanceTypeOptions = { getLabel, getOption, options };
