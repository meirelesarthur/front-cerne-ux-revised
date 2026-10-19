// src/pages/Operacional/DiscountTable/HeaderDiscountTableTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Descontos/Classificação (DiscountTable —
// Operacional/Agricultura, F-032, TASK-DT-FE-02) — SÓ os botões de ação
// (adicionar / personalizar grid / abrir filtro); as colunas vivem em
// `discount-table-columns.tsx`. Mirror `HeaderFeedingPhaseTable.tsx`.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import type { LanguageDate } from '@/@types/language';

interface HeaderDiscountTableTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
  canCreate: boolean;
}

export function HeaderDiscountTableTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  gridSettings,
  canCreate,
}: HeaderDiscountTableTableProps) {
  const navigate = useNavigate();

  return (
    <>
      {canCreate && (
        <ButtonAdd
          onClick={() => navigate('/operacional/discount-tables/create')}
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
