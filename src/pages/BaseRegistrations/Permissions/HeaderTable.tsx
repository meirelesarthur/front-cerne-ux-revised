// src/pages/BaseRegistrations/Permissions/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Permissões — execução 032, TASK-FE-2401. Mirror
// `BaseRegistrations/Banks/HeaderTable.tsx` — busca simples (toolbar, NÃO
// filtro lateral, contrato de tela §7.2: capacidade real do backend
// `PermissionFilterData.search`, ILIKE em `name`+`description`) + botão
// "Novo" (`permissions_create`) + `GridSettingsFloatingPanel`.
//
// Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { Input } from '@/components/Form/Input';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { usePermissions } from '@/hooks/usePermissions';
import { useTable } from '@/hooks/useTable';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
}

export function HeaderTable({
  searchValue,
  onSearchChange,
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
      navigate(`/cadastros-base/permissoes/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  const text = languageGB.baseRegistrations.permission;

  return (
    <>
      <Input
        placeholder={text.list.search.placeholder}
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        startElement={Search}
        width={{ base: 'full', md: '280px' }}
      />
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
      {can('permissions_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/permissoes/novo')}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
