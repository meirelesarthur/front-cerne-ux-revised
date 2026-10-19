// src/pages/Operacional/Diet/HeaderDietTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Dieta (Diet — Operacional/Pecuária,
// TASK-FE-DIET-02) — SÓ os botões de ação (adicionar / personalizar grid /
// abrir filtro); as colunas vivem em `diet-columns.tsx`. Mirror
// `CentroCusto/HeaderTable.tsx`/`Fabrica/index.tsx` (Food).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import type { LanguageDate } from '@/@types/language';

interface HeaderDietTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
  canCreate: boolean;
}

export function HeaderDietTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  gridSettings,
  canCreate,
}: HeaderDietTableProps) {
  const navigate = useNavigate();

  return (
    <>
      {canCreate && (
        <ButtonAdd onClick={() => navigate('/operacional/dietas/novo')} languageGB={languageGB} />
      )}
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
