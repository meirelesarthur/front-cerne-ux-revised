// src/pages/Operacional/ServiceOrders/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Ordens de Serviço (ServiceOrder) — TASK-FE-2002.
// "Emitir OS" (`ButtonAdd`, gate `service-orders_create`) + `ButtonFilter` —
// mirror `Appropriations/HeaderTable.tsx` (sem os 2 botões desabilitados de
// Apontamentos, que eram específicos daquele módulo — não replicar UI que
// esta feature não pediu).
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
