// src/pages/BaseRegistrations/Warehouses/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Armazéns (mirror mecânico de
// CentroCusto/HeaderTable.tsx, Warehouse-contrato-frontend.md §5.1).
//
// SÓ os botões de ação (adicionar / abrir filtro) — as colunas vivem no
// index.tsx. O botão "Novo" respeita SOMENTE `warehouses_create` — SEM a
// exceção `hasRole('Gestor_Plataf')` de CentroCusto (DEC-005/GAP-BE-032 é
// particularidade de hierarquia de Centro de Custo; Warehouse não tem
// hierarquia, então a permissão global já é suficiente). Ao selecionar uma
// linha, navega para a edição (mesmo padrão do projeto).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
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
      navigate(`/cadastros-base/armazens/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('warehouses_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/armazens/novo`)}
          languageGB={languageGB}
        />
      )}
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
    </>
  );
}
