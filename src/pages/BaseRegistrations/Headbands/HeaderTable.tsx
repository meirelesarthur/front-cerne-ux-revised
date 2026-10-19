// src/pages/BaseRegistrations/Headbands/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Testeiras (TASK-HB-FE-03) — mirror de
// `CadastrosBase/CentroCusto/HeaderTable.tsx` (canário `GridSettings`,
// mandato explícito do task-packet).
//
// SÓ os botões de ação (adicionar / grid settings / abrir filtro) — as
// colunas vivem no `index.tsx`. Ao selecionar uma linha da grid, navega para
// a edição (padrão do projeto).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { usePermissions } from '@/hooks/usePermissions';
import { useTable } from '@/hooks/useTable';

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
  const { table } = useTable();

  // Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/configuracoes/testeiras/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('headbands_create') && (
        <ButtonAdd
          onClick={() => navigate(`/configuracoes/testeiras/novo`)}
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
