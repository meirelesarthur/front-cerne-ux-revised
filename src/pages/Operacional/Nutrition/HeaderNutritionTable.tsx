// src/pages/Operacional/Nutrition/HeaderNutritionTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Nutrição (Nutrition — Operacional, F-050,
// esteira 066, TASK-NT-FE-02/03). Mirror `CentroCusto/HeaderTable.tsx`
// (personalização de grid V2 — `GridSettingsFloatingPanel`).
//
// `ButtonAdd` acrescentado em `TASK-NT-FE-03` — a rota `/operacional/
// nutricao/novo` agora existe (form único de criar/editar, SRF-03/04/05/09).
// Gated por `nutrition_create` (mirror `HeaderTable.tsx` de Centro de Custo/
// Batida).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

interface HeaderNutritionTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
}

export function HeaderNutritionTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  gridSettings,
}: HeaderNutritionTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();

  return (
    <>
      {can('nutrition_create') && (
        <ButtonAdd onClick={() => navigate('/operacional/nutricao/novo')} languageGB={languageGB} />
      )}
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}

export default HeaderNutritionTable;
