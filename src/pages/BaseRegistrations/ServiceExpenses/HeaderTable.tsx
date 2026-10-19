// src/pages/BaseRegistrations/ServiceExpenses/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Serviços (mirror mecânico de
// Estorno/HeaderTable.tsx).
//
// SÓ os botões de ação (adicionar / abrir filtro) — as colunas vivem no
// index.tsx. O botão "Novo" respeita SOMENTE `service_create`. Ao selecionar
// uma linha, navega para a edição (mesmo padrão do projeto).
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
      navigate(`/cadastros-base/servicos/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('service_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/servicos/novo`)}
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
