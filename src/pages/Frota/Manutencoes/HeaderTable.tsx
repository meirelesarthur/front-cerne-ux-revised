// src/pages/Frota/Manutencoes/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Manutenções — Tarefa 43. Mirror EXATO
// `Frota/Abastecimentos/HeaderTable.tsx`.
// -----------------------------------------------------------------------------

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  canCreate: boolean;
  onCreate: () => void;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  canCreate,
  onCreate,
  gridSettings,
}: HeaderTableProps) {
  return (
    <>
      {canCreate && <ButtonAdd onClick={onCreate} languageGB={languageGB} />}

      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
