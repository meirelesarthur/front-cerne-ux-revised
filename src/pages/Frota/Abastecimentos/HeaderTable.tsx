// src/pages/Frota/Abastecimentos/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Abastecimentos (Supply) — Tarefa 40. Mirror
// `Operacional/Appropriations/HeaderTable.tsx`, MENOS os 2 botões extras
// "Saiba +"/"Pagamentos" (específicos do módulo Apontamentos, D4 do contrato
// de Apontamentos — sem equivalente decidido para Abastecimentos).
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
