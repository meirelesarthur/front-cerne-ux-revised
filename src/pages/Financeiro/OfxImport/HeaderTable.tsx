// src/pages/Financeiro/OfxImport/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Importação OFX (OfxImport, F-114,
// 97-Esteiras/064, TASK-064-OFX-FE-01) — mirror
// `Financeiro/MovCaixaBancario/HeaderTable.tsx`. Botão "Nova Importação"
// (gated `import_ofx_create`, navega para `/financeiro/ofx/novo`) +
// `GridSettingsFloatingPanel` + `ButtonFilter`.
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
      {can('import_ofx_create') && (
        <ButtonAdd onClick={() => navigate('/financeiro/ofx/novo')} languageGB={languageGB} />
      )}
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
