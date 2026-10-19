// src/pages/Planos/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Planos (PlanRole, TASK-FE-2701) — mirror
// `Configuracoes/Apps/HeaderTable.tsx` (botões de ação) + `useGridSettings`/
// `GridSettingsFloatingPanel` (protocolo `padrao-frontend-gb-cerne-v2`,
// mirror `CadastrosBase/CentroCusto/HeaderTable.tsx`). Só os botões — as
// colunas vivem em `index.tsx`. O botão "Novo" respeita `plan_create`.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { useTable } from '@/hooks/useTable';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  canCreate: boolean;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  canCreate,
  gridSettings,
}: HeaderTableProps) {
  const navigate = useNavigate();
  const { table } = useTable();

  // Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/planos/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {canCreate && (
        <ButtonAdd onClick={() => navigate('/planos/create')} languageGB={languageGB} />
      )}
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
