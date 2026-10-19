// src/pages/Financeiro/MercadoPago/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Financeiro Mercado Pago — SÓ personalização de
// grid (`GridSettingsFloatingPanel`, regra 8 do protocolo v2) + abrir o
// drawer de filtro (mirror `SaldoInicial/HeaderTable.tsx`/
// `CentroCusto/HeaderTable.tsx`). SEM `ButtonAdd` — tela 100% read-only,
// sem create/edit/delete nesta fase (contrato de tela §5, decisão do dono).
// -----------------------------------------------------------------------------

import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { LanguageDate } from '@/@types/language';

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
