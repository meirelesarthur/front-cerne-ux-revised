// src/pages/Financeiro/Congelamentos/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Congelamentos Financeiros (FinancialFreeze —
// F-110, Tarefa 31) — mirror
// `Financeiro/Conciliacao/ImportacaoOfx/HeaderTable.tsx`. Botão "Novo"
// (gated `financial-freeze_create`) + `GridSettingsFloatingPanel` +
// `ButtonFilter`.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { usePermissions } from '@/hooks/usePermissions';

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
  const navigate = useNavigate();
  const { can } = usePermissions();

  return (
    <>
      {can('financial-freeze_create') && (
        <ButtonAdd
          onClick={() => navigate('/financeiro/congelamentos/novo')}
          languageGB={languageGB}
        />
      )}
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
