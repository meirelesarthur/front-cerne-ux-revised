// src/pages/BaseRegistrations/Groupers/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da listagem em árvore de Agrupadores (mesmo padrão de
// GruposProduto/HeaderTable.tsx e TiposTitulo/HeaderTable.tsx).
//
// SÓ os botões de ação (adicionar / abrir filtro) — as colunas/linhas vivem
// em index.tsx + GrouperTreeView.tsx. Sem o `useEffect` de "navega ao
// selecionar linha" do precedente flat (GruposProduto): a árvore não usa
// TableProvider/useTable (linhas são Chakra Table.Row diretas, ver nota de
// topo de GrouperTreeView.tsx), então não há `table.getSelectedRowModel()`
// para observar aqui.
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
      {can('groupers_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/agrupadores/novo')}
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
