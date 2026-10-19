// src/pages/Operacional/Diet/DietBeat/HeaderDietBeatTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Batida (DietBeat — Operacional/Pecuária,
// TASK-FE-DIET-05) — SÓ os botões de ação; as colunas vivem em
// `diet-beat-columns.tsx`. Mirror `HeaderDietTable.tsx`/`FoodBeat/index.tsx`.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import type { LanguageDate } from '@/@types/language';

interface HeaderDietBeatTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
  canCreate: boolean;
}

export function HeaderDietBeatTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  gridSettings,
  canCreate,
}: HeaderDietBeatTableProps) {
  const navigate = useNavigate();

  return (
    <>
      {canCreate && (
        <ButtonAdd
          onClick={() => navigate('/operacional/dietas/batidas/novo')}
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
