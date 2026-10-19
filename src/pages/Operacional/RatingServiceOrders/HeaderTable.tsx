// src/pages/Operacional/RatingServiceOrders/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Avaliações de Ordem de Serviço
// (RatingServiceOrder) — TASK-FE-041-AVL-02. `ButtonFilter` + config de
// colunas — mirror `ServiceOrders/HeaderTable.tsx`, SEM `ButtonAdd` (esta
// feature não tem modo criação, `mode_matrix.criar = NAO_APLICAVEL`).
// -----------------------------------------------------------------------------

import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { ButtonFilter } from '@/components/ButtonFilter';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  gridSettings,
}: HeaderTableProps) {
  return (
    <>
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
