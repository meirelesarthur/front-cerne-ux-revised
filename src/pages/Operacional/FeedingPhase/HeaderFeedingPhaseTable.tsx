// src/pages/Operacional/FeedingPhase/HeaderFeedingPhaseTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Fases de Alimentação (FeedingPhase —
// Operacional/Pecuária/Confinamento, F-034, TASK-FP-FE-02) — SÓ os botões de
// ação (adicionar / personalizar grid / abrir filtro); as colunas vivem em
// `feeding-phase-columns.tsx`. Mirror `HeaderDietTable.tsx`.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import type { LanguageDate } from '@/@types/language';

interface HeaderFeedingPhaseTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
  canCreate: boolean;
}

export function HeaderFeedingPhaseTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  gridSettings,
  canCreate,
}: HeaderFeedingPhaseTableProps) {
  const navigate = useNavigate();

  return (
    <>
      {canCreate && (
        <ButtonAdd
          onClick={() => navigate('/operacional/fases-alimentacao/novo')}
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
